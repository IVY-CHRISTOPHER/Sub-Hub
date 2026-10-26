// This file handles everything about a user's subscriptions: list, totals, add, edit, delete.
const express = require("express");
const mongoose = require("mongoose");
const auth = require("../middleware/auth");
const Subscription = require("../models/Subscription");

const router = express.Router();
// Every route below requires the user to be logged in.
router.use(auth);

// The only fields the website is allowed to set. Anything else it sends is ignored.
const FIELDS = ["name", "price", "currency", "cycle", "nextBillingDate", "category", "status"];
// Copy just the allowed fields from the incoming data.
const pick = (body) => Object.fromEntries(FIELDS.filter((f) => body[f] !== undefined).map((f) => [f, body[f]]));

// To compare yearly, monthly, and weekly prices fairly, convert everything to "per month".
// Yearly is 1/12 of a month's worth; weekly is 52 weeks / 12 months.
const MONTHLY_FACTOR = { weekly: 52 / 12, monthly: 1, yearly: 1 / 12 };
const toMonthly = (s) => s.price * MONTHLY_FACTOR[s.cycle];
// Round to 2 decimal places (cents).
const round = (n) => Math.round(n * 100) / 100;

// Return a subscription with an extra "monthlyCost" value added.
const withMonthly = (doc) => ({ ...doc.toObject(), monthlyCost: round(toMonthly(doc)) });

// GET LIST: all of this user's subscriptions, soonest renewal first.
router.get("/", async (req, res) => {
    const subs = await Subscription.find({ userId: req.userId }).sort({ nextBillingDate: 1 });
    res.json(subs.map(withMonthly));
});

// GET SUMMARY: the totals shown at the top of the dashboard.
router.get("/summary", async (req, res) => {
    // Only count subscriptions that are active (not paused).
    const subs = await Subscription.find({ userId: req.userId, status: "active" });
    // Add up the monthly cost of all of them.
    const monthly = subs.reduce((sum, s) => sum + toMonthly(s), 0);
    // Add up the monthly cost separately for each category.
    const byCategory = {};
    for (const s of subs) byCategory[s.category] = (byCategory[s.category] || 0) + toMonthly(s);

    // Find the ones renewing within the next 30 days, soonest first.
    const now = new Date();
    const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const upcoming = subs
        .filter((s) => s.nextBillingDate >= now && s.nextBillingDate <= in30)
        .sort((a, b) => a.nextBillingDate - b.nextBillingDate)
        .map(withMonthly);

    res.json({
        monthlyTotal: round(monthly),
        yearlyTotal: round(monthly * 12),
        activeCount: subs.length,
        byCategory: Object.fromEntries(Object.entries(byCategory).map(([k, v]) => [k, round(v)])),
        upcoming,
    });
});

// ADD: save a new subscription for this user.
router.post("/", async (req, res) => {
    try {
        const sub = await Subscription.create({ ...pick(req.body), userId: req.userId });
        res.status(201).json(withMonthly(sub));
    } catch (err) {
        // Bad input (like a missing name) comes back as a 400 error with a message.
        res.status(400).json({ error: err.message });
    }
});

// EDIT: change an existing subscription (only if it belongs to this user).
router.put("/:id", async (req, res) => {
    // Make sure the ID in the web address is a real database ID.
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: "Invalid id" });
    try {
        const sub = await Subscription.findOneAndUpdate(
            { _id: req.params.id, userId: req.userId },
            pick(req.body),
            { new: true, runValidators: true }
        );
        // Nothing found means it doesn't exist or isn't theirs.
        if (!sub) return res.status(404).json({ error: "Not found" });
        res.json(withMonthly(sub));
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// DELETE: remove a subscription (only if it belongs to this user).
router.delete("/:id", async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: "Invalid id" });
    const sub = await Subscription.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!sub) return res.status(404).json({ error: "Not found" });
    res.status(204).end();
});

module.exports = router;
