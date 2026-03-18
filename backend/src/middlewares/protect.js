import jwt from "jsonwebtoken";
import Admin from "../models/admin.model.js";

// Protect routes — only verified admins pass through
const protect = async (req, res, next) => {
  let token;
 
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }
 
  if (!token) {
    return res.status(401).json({ success: false, message: "Not authorized, no token" });
  }
 
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Attach admin to request (exclude password)
    req.admin = await Admin.findById(decoded.id);
 
    if (!req.admin) {
      return res.status(401).json({ success: false, message: "Admin not found" });
    }
 
    if (!req.admin.isActive) {
      return res.status(403).json({ success: false, message: "Account is deactivated" });
    }
 
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Token invalid or expired" });
  }
};
 
// Superadmin-only gate — use after protect
const superAdminOnly = (req, res, next) => {
  if (req.admin.role !== "superadmin") {
    return res.status(403).json({
      success: false,
      message: "Only superadmin can perform this action",
    });
  }
  next();
};

const protectMiddleware = { protect, superAdminOnly };
export default protectMiddleware