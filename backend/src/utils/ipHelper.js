import crypto from "crypto";

const getRawIp = (req) => {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    // x-forwarded-for can be a comma-separated list — take first
    return forwarded.split(",")[0].trim();
  }
  return req.socket?.remoteAddress || req.ip || "unknown";
};

const getHashedIp = (req) => {
  const raw = getRawIp(req);
  const salt = process.env.IP_HASH_SALT || "medi-quick-default-salt";
  return crypto.createHmac("sha256", salt).update(raw).digest("hex");
};

const ipHelper = { getRawIp, getHashedIp };
export default ipHelper;