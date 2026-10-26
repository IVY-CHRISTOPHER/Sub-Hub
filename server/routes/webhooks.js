app.post("/api/webhooks/stripe", async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET,
        );
    } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === "issuing_authorization.request") {
        const auth = event.data.object;
        // Logic to check if user has funds/hasn't paused this subscription
        // If approved:
        await stripe.issuing.authorizations.approve(auth.id);
    }

    res.json({ received: true });
});
