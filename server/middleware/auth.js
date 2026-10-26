// This file is a "security guard". Any route that uses it will only work for logged-in users.
// When you log in you receive a "token" (like a wristband). The website sends it with every request.
const jwt = require("jsonwebtoken");

module.exports = function auth(req, res, next) {
    // Look for the token in the request's "Authorization" header; it looks like "Bearer <token>".
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    // No token at all? Turn the visitor away (401 means "not logged in").
    if (!token)
        return res.status(401).json({ error: "Authentication required" });

    try {
        // Check the token is real and not expired, then remember which user it belongs to.
        req.userId = jwt.verify(token, process.env.JWT_SECRET).id;
        // Let the request continue on to the actual route.
        next();
    } catch {
        // The token was fake or too old.
        res.status(401).json({ error: "Invalid or expired token" });
    }
};
