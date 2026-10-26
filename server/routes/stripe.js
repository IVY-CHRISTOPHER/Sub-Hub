const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// When a user clicks "Generate Card", create a Stripe Cardholder and issue the card.
app.post("/api/stripe/issue_card", async (req, res) => {
    // 1. Create a Cardholder (Requires KYC details in production)
    const cardholder = await stripe.issuing.cardholders.create({
        type: "individual",
        name: req.body.name,
        billing: { address: req.body.address },
    });

    // 2. Issue a Virtual Card attached to this Cardholder
    const card = await stripe.issuing.cards.create({
        cardholder: cardholder.id,
        type: "virtual",
        currency: "usd",
    });

    res.json(card);
});
