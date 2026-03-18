import bcrypt from "bcryptjs";
import Admin from "../models/admin.model.js";
import generateToken from "../utils/generateToken.js";
import authConfig from "../config/auth.config.js";

// @desc    Login admin
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    // Explicitly select password (it's excluded by default)
    const admin = await Admin.findOne({ email }).select("+password");

    if (!admin ) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const isMatched = await bcrypt.compare(password, admin.password);

    if (!isMatched) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    if (!admin.isActive) {
      return res.status(403).json({ success: false, message: "Account is deactivated" });
    }

    const token = authConfig.encodeToken(admin?.email, admin?._id).toString();

    res.cookie("user-token",token);

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        
      },
      token: token
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get currently logged in admin
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      data: req.admin,
    });
  } catch (error) {
    next(error);
  }
};

const authController = { login, getMe };
export default authController;