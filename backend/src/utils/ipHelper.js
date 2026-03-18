const crypto = require("crypto");

/**
 * Extract the real IP from request.
 * Works behind proxies (nginx, Render, Railway, etc.)
 */
const getRawIp = (req) => {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    // x-forwarded-for can be a comma-separated list — take first
    return forwarded.split(",")[0].trim();
  }
  return req.socket?.remoteAddress || req.ip || "unknown";
};

/**
 * Hash the IP so we never store raw IPs in the database.
 * SHA-256 + a secret salt from env.
 */
const getHashedIp = (req) => {
  const raw = getRawIp(req);
  const salt = process.env.IP_HASH_SALT || "medi-quick-default-salt";
  return crypto.createHmac("sha256", salt).update(raw).digest("hex");
};

module.exports = { getRawIp, getHashedIp };