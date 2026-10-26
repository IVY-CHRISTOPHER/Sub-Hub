// This model describes ONE user account in the database.
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    // The user's email. Required, and no two accounts can share one.
    email: { type: String, required: true, unique: true },
    // The user's password, stored only in scrambled (hashed) form, never as plain text.
    password: { type: String, required: true },
    // The (encrypted) key that lets us read recurring charges from their linked bank.
    plaidAccessToken: { type: String },
    // The user's ID inside Stripe (the payment company). Not used yet.
    stripeCustomerId: { type: String },
});

module.exports = mongoose.model("User", userSchema);
