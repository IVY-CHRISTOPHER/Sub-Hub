// A "model" describes what one piece of saved data looks like in the database.
// This model describes ONE subscription (for example "Netflix, $15.49 a month").
const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
    {
        // Which user owns this subscription (so people only see their own).
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        // The service name, like "Netflix". Required, extra spaces removed, max 80 characters.
        name: { type: String, required: true, trim: true, maxlength: 80 },
        // How much it costs each billing period. Required and can't be negative.
        price: { type: Number, required: true, min: 0 },
        // The type of money (USD = US dollars). Defaults to USD.
        currency: { type: String, default: "USD", uppercase: true, trim: true },
        // How often you are charged: weekly, monthly, or yearly. Defaults to monthly.
        cycle: {
            type: String,
            enum: ["weekly", "monthly", "yearly"],
            default: "monthly",
        },
        // The date of the next charge.
        nextBillingDate: { type: Date, required: true },
        // A label for grouping, like "Streaming" or "Music".
        category: { type: String, default: "Other", trim: true, maxlength: 40 },
        // "active" means you're paying for it. "paused" means it's ignored in totals.
        status: { type: String, enum: ["active", "paused"], default: "active" },
        // If it was found from a bank account, the bank's ID for it (prevents importing it twice).
        plaidStreamId: { type: String },
    },
    // Automatically record when each subscription was created and last changed.
    { timestamps: true },
);

module.exports = mongoose.model("Subscription", subscriptionSchema);
