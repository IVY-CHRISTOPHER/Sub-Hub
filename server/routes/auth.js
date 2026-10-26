// This file handles creating accounts ("register") and logging in ("login").
const express = require("express");
const bcrypt = require("bcryptjs");            // Scrambles passwords so they can't be read
const jwt = require("jsonwebtoken");           // Creates the login "token" (wristband)
const rateLimit = require("express-rate-limit"); // Blocks people who try too many times (stops password guessing)
const User = require("../models/User");

const router = express.Router();
// Allow each visitor at most 50 requests every 15 minutes on these routes.
router.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 50 }));

// Make a login token for a user. It proves who they are and expires after 7 days.
const sign = (user) =>
    jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

// Pull the email and password out of what the website sent, and tidy them up
// (trim spaces, make the email lowercase). Missing values become empty text.
const readCredentials = (body) => {
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    return { email, password };
};

// SIGN UP: create a new account.
router.post("/register", async (req, res) => {
    try {
        const { email, password } = readCredentials(req.body);
        // Reject emails that don't look like name@site.com.
        if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: "Valid email required" });
        // Reject short passwords.
        if (password.length < 8) return res.status(400).json({ error: "Password must be at least 8 characters" });
        // Reject emails that already have an account (409 = conflict).
        if (await User.exists({ email })) return res.status(409).json({ error: "Email already registered" });

        // Scramble the password and save the new user, then log them straight in.
        const user = await User.create({ email, password: await bcrypt.hash(password, 12) });
        res.status(201).json({ token: sign(user), user: { id: user._id, email } });
    } catch (err) {
        res.status(500).json({ error: "Registration failed" });
    }
});

// LOG IN: check the email and password and hand back a token.
router.post("/login", async (req, res) => {
    try {
        const { email, password } = readCredentials(req.body);
        const user = await User.findOne({ email });
        // Same vague message whether the email or password is wrong, so attackers learn nothing.
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: "Invalid email or password" });
        }
        res.json({ token: sign(user), user: { id: user._id, email } });
    } catch (err) {
        res.status(500).json({ error: "Login failed" });
    }
});

module.exports = router;
