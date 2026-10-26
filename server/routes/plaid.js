// This file connects Sub-Hub to a user's bank through Plaid (a company that securely reads
// bank data). It finds charges that repeat on a schedule (likely subscriptions) so the user
// doesn't have to type them in by hand.
const express = require('express');
const { Configuration, PlaidApi, PlaidEnvironments } = require('plaid');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const { encrypt, decrypt } = require('../utils/crypto');

// Set up our connection to Plaid, using our company ID and secret from the .env file.
// "sandbox" means practice mode with fake banks, until PLAID_ENV says otherwise.
const client = new PlaidApi(
    new Configuration({
        basePath: PlaidEnvironments[process.env.PLAID_ENV || 'sandbox'],
        baseOptions: {
            headers: {
                'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
                'PLAID-SECRET': process.env.PLAID_SECRET,
            },
        },
    })
);

const router = express.Router();
// Every route below requires the user to be logged in.
router.use(auth);

// Translate Plaid's names for how often a charge repeats into the names we use.
// Anything not listed here (like every two weeks) is skipped.
const CYCLES = { WEEKLY: 'weekly', MONTHLY: 'monthly', ANNUALLY: 'yearly' };

// Handle a failed Plaid call: log the details for us, and send the user a friendly message.
const plaidError = (res, err, fallback) => {
    const detail = err.response?.data;
    console.error('Plaid error:', detail || err.message);
    // "Not ready" just means Plaid is still loading the bank's data; try again shortly.
    if (detail?.error_code === 'PRODUCT_NOT_READY') {
        return res.status(202).json({ error: 'Bank data is still loading, try again in a moment' });
    }
    res.status(502).json({ error: fallback });
};

// STEP 1: ask Plaid for a one-time "link token". The website needs it to open the
// pop-up window where the user picks their bank and logs in.
router.post('/link-token', async (req, res) => {
    try {
        const { data } = await client.linkTokenCreate({
            user: { client_user_id: String(req.userId) },
            client_name: 'Sub-Hub',
            products: ['transactions'],   // We only ask to read transactions
            country_codes: ['US'],
            language: 'en',
        });
        res.json({ linkToken: data.link_token });
    } catch (err) {
        plaidError(res, err, 'Could not start bank linking');
    }
});

// STEP 2: after the user finishes the pop-up, Plaid gives the website a temporary "public token".
// We swap it for a long-lasting access key, scramble it, and save it on the user.
router.post('/exchange', async (req, res) => {
    if (typeof req.body.publicToken !== 'string') return res.status(400).json({ error: 'publicToken required' });
    try {
        const { data } = await client.itemPublicTokenExchange({ public_token: req.body.publicToken });
        await User.findByIdAndUpdate(req.userId, { plaidAccessToken: encrypt(data.access_token) });
        res.json({ linked: true });
    } catch (err) {
        plaidError(res, err, 'Could not link bank');
    }
});

// Helper: get the user's repeating charges from their bank, minus ones already imported.
// Returns null if they haven't connected a bank yet.
const fetchStreams = async (userId) => {
    const user = await User.findById(userId);
    if (!user?.plaidAccessToken) return null;
    // Unscramble the saved key and ask Plaid for repeating charges ("recurring outflows").
    const { data } = await client.transactionsRecurringGet({ access_token: decrypt(user.plaidAccessToken) });
    // Collect the IDs of charges the user has already imported, so we don't offer them again.
    const existing = new Set(
        (await Subscription.find({ userId, plaidStreamId: { $exists: true } }, 'plaidStreamId')).map((s) => s.plaidStreamId)
    );
    return data.outflow_streams
        // Keep only charges that are still happening, repeat weekly/monthly/yearly, and are new to us.
        .filter((s) => s.is_active && CYCLES[s.frequency] && !existing.has(s.stream_id))
        // Reshape each one to match our own subscription format.
        .map((s) => ({
            streamId: s.stream_id,
            name: s.merchant_name || s.description,
            price: Math.abs(s.last_amount?.amount ?? s.average_amount.amount),
            currency: s.average_amount.iso_currency_code || 'USD',
            cycle: CYCLES[s.frequency],
            nextBillingDate: s.predicted_next_date,
            category: 'Other',
        }));
};

// STEP 3: show the user the subscriptions we found (without saving anything yet).
router.get('/detected', async (req, res) => {
    try {
        const streams = await fetchStreams(req.userId);
        res.json(streams === null ? { linked: false, streams: [] } : { linked: true, streams });
    } catch (err) {
        plaidError(res, err, 'Could not read recurring charges');
    }
});

// STEP 4: save the ones the user ticked as real subscriptions.
router.post('/import', async (req, res) => {
    // The list of IDs the user chose (or an empty list if the data was invalid).
    const ids = Array.isArray(req.body.streamIds) ? req.body.streamIds : [];
    try {
        const streams = (await fetchStreams(req.userId)) || [];
        // Only accept IDs that are really in the detected list (so users can't invent their own).
        const chosen = streams.filter((s) => ids.includes(s.streamId));
        // Save them all at once, tagged with the user and the Plaid ID.
        const created = await Subscription.insertMany(
            chosen.map(({ streamId, nextBillingDate, ...rest }) => ({
                ...rest,
                nextBillingDate: nextBillingDate ? new Date(nextBillingDate) : new Date(),
                plaidStreamId: streamId,
                userId: req.userId,
            }))
        );
        res.status(201).json({ imported: created.length });
    } catch (err) {
        plaidError(res, err, 'Could not import subscriptions');
    }
});

module.exports = router;
