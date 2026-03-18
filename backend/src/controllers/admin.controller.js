import Admin from "../models/admin.model.js";
import generateToken from "../utils/generateToken.js";

// @desc    Create a new admin account
// @route   POST /api/admin/accounts
// @access  Private (superadmin only)
const createAccount = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Name, email and password are required" });
    }

    const existing = await Admin.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: "Email already in use" });
    }

    const admin = await Admin.create({
      name,
      email,
      password,
      role: role || "admin",
    });

    res.status(201).json({
      success: true,
      message: "Admin account created",
      data: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        isActive: admin.isActive,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all admin accounts
// @route   GET /api/admin/accounts
// @access  Private (any admin)
const getAllAccounts = async (req, res, next) => {
  try {
    const admins = await Admin.find().select("-password").sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: admins.length,
      data: admins,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single admin account
// @route   GET /api/admin/accounts/:id
// @access  Private (any admin)
const getAccount = async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.params.id).select("-password");

    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }

    res.status(200).json({ success: true, data: admin });
  } catch (error) {
    next(error);
  }
};

// @desc    Update account status or role
//          - activate / deactivate an admin
//          - promote to superadmin or demote to admin
// @route   PATCH /api/admin/accounts/:id/status
// @access  Private (superadmin only)
const updateAccountStatus = async (req, res, next) => {
  try {
    const { isActive, role } = req.body;

    // Prevent superadmin from deactivating themselves
    if (req.params.id === req.admin._id.toString()) {
      return res.status(400).json({ success: false, message: "You cannot change your own status or role" });
    }

    const admin = await Admin.findById(req.params.id);
    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }

    // Only update fields that are actually provided
    if (typeof isActive !== "undefined") admin.isActive = isActive;
    if (role && ["admin", "superadmin"].includes(role)) admin.role = role;

    await admin.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: "Account updated",
      data: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        isActive: admin.isActive,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete an admin account
// @route   DELETE /api/admin/accounts/:id
// @access  Private (superadmin only)
const deleteAccount = async (req, res, next) => {
  try {
    if (req.params.id === req.admin._id.toString()) {
      return res.status(400).json({ success: false, message: "You cannot delete your own account" });
    }

    const admin = await Admin.findByIdAndDelete(req.params.id);

    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }

    res.status(200).json({ success: true, message: "Admin account deleted" });
  } catch (error) {
    next(error);
  }
};

// @desc    Update own password
// @route   PATCH /api/admin/accounts/me/password
// @access  Private (any admin — own account only)
const updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: "Both current and new password are required" });
    }

    const admin = await Admin.findById(req.admin._id).select("+password");

    if (!(await admin.matchPassword(currentPassword))) {
      return res.status(401).json({ success: false, message: "Current password is incorrect" });
    }

    admin.password = newPassword;
    await admin.save();

    res.status(200).json({
      success: true,
      message: "Password updated",
      data: { token: generateToken(admin._id) }, // issue fresh token
    });
  } catch (error) {
    next(error);
  }
};

const adminController = {
  createAccount,
  getAllAccounts,
  getAccount,
  updateAccountStatus,
  deleteAccount,
  updatePassword,
};
export default adminController;