// Helpers to scramble ("encrypt") and unscramble ("decrypt") sensitive text,
// so that bank access keys are never stored in the database in readable form.
const crypto = require('crypto');

// Build the secret lock-key from a password in the .env file.
const key = () =>
    crypto.createHash('sha256').update(process.env.TOKEN_ENCRYPTION_KEY || process.env.JWT_SECRET).digest();

// Scramble text. The result is a single string that is safe to store.
exports.encrypt = (text) => {
    const iv = crypto.randomBytes(12);  // A random value so the same text scrambles differently each time
    const cipher = crypto.createCipheriv('aes-256-gcm', key(), iv);
    const data = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    // Join the pieces needed to unscramble later into one string.
    return [iv, cipher.getAuthTag(), data].map((b) => b.toString('base64')).join('.');
};

// Turn scrambled text back into the original text.
exports.decrypt = (payload) => {
    // Split the stored string back into its pieces.
    const [iv, tag, data] = payload.split('.').map((s) => Buffer.from(s, 'base64'));
    const decipher = crypto.createDecipheriv('aes-256-gcm', key(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
};
