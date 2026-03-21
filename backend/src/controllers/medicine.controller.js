import Medicine from "../models/medicine.model.js";

// @desc    Add a new medicine (public)
// @route   POST /api/medicines
// @access  Public
const addMedicine = async (req, res, next) => {
  try {
    const { genericName, brandNames, category, description } = req.body;

    if (!genericName) {
      return res.status(400).json({ success: false, message: "Generic name is required" });
    }

    // Check for duplicate generic name
    const existing = await Medicine.findOne({ genericName: genericName.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Medicine with this generic name already exists",
        data: existing,
      });
    }

    const medicine = await Medicine.create({
      genericName: genericName.toLowerCase().trim(),
      brandNames: brandNames || [],
      category: category || "other",
      description: description || "",
      addedBy: req.admin ? "admin" : "user",
    });

    res.status(201).json({ success: true, message: "Medicine added", data: medicine });
  } catch (error) {
    next(error);
  }
};

// @desc    Search medicines by generic name or brand name (public)
// @route   GET /api/medicines/search?q=paracetamol
// @access  Public
const searchMedicines = async (req, res, next) => {
  try {
    const { q } = req.query;

    if (!q || q.trim() === "") {
      return res.status(400).json({ success: false, message: "Search query is required" });
    }

    const medicines = await Medicine.find({
      isBlocked: false,
      $or: [
        { genericName: { $regex: q.trim(), $options: "i" } },
        { brandNames: { $elemMatch: { $regex: q.trim(), $options: "i" } } },
      ],
    }).sort({ genericName: 1 });

    res.status(200).json({
      success: true,
      count: medicines.length,
      data: medicines,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all medicines (public, with pagination)
// @route   GET /api/medicines?page=1&limit=20&category=antibiotic
// @access  Public
const getAllMedicines = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = { isBlocked: false };
    if (req.query.category) filter.category = req.query.category;

    const [medicines, total] = await Promise.all([
      Medicine.find(filter).sort({ genericName: 1 }).skip(skip).limit(limit),
      Medicine.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: medicines,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single medicine by ID (public)
// @route   GET /api/medicines/:id
// @access  Public
const getMedicine = async (req, res, next) => {
  try {
    const medicine = await Medicine.findOne({ _id: req.params.id, isBlocked: false });

    if (!medicine) {
      return res.status(404).json({ success: false, message: "Medicine not found" });
    }

    res.status(200).json({ success: true, data: medicine });
  } catch (error) {
    next(error);
  }
};

// @desc    Update medicine details (public — anyone can suggest edits)
// @route   PATCH /api/medicines/:id
// @access  Public
const updateMedicine = async (req, res, next) => {
  try {
    const { genericName, brandNames, category, description } = req.body;

    const medicine = await Medicine.findById(req.params.id);
    if (!medicine) {
      return res.status(404).json({ success: false, message: "Medicine not found" });
    }

    if (medicine.isBlocked && !req.admin) {
      return res.status(403).json({ success: false, message: "This medicine is blocked" });
    }

    if (genericName) medicine.genericName = genericName.toLowerCase().trim();
    if (brandNames) medicine.brandNames = brandNames;
    if (category) medicine.category = category;
    if (description) medicine.description = description;

    await medicine.save();

    res.status(200).json({ success: true, message: "Medicine updated", data: medicine });
  } catch (error) {
    next(error);
  }
};

// @desc    Update medicine image (public)
// @route   PATCH /api/medicines/:id/image
// @access  Public
const updateMedicineImage = async (req, res, next) => {
  try {
    const { url, publicId } = req.body;

    if (!url) {
      return res.status(400).json({ success: false, message: "Image URL is required" });
    }

    const medicine = await Medicine.findByIdAndUpdate(
      req.params.id,
      { image: { url, publicId: publicId || "" } },
      { new: true }
    );

    if (!medicine) {
      return res.status(404).json({ success: false, message: "Medicine not found" });
    }

    res.status(200).json({ success: true, message: "Image updated", data: medicine });
  } catch (error) {
    next(error);
  }
};

// ─── ADMIN ONLY ────────────────────────────────────────────────────────────────

// @desc    Block / unblock a medicine (admin)
// @route   PATCH /api/medicines/:id/block
// @access  Private
const toggleBlockMedicine = async (req, res, next) => {
  try {
    const medicine = await Medicine.findById(req.params.id);
    if (!medicine) {
      return res.status(404).json({ success: false, message: "Medicine not found" });
    }

    medicine.isBlocked = !medicine.isBlocked;
    await medicine.save();

    res.status(200).json({
      success: true,
      message: `Medicine ${medicine.isBlocked ? "blocked" : "unblocked"}`,
      data: medicine,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a medicine (admin)
// @route   DELETE /api/medicines/:id
// @access  Private
const deleteMedicine = async (req, res, next) => {
  try {
    const medicine = await Medicine.findByIdAndDelete(req.params.id);
    if (!medicine) {
      return res.status(404).json({ success: false, message: "Medicine not found" });
    }

    res.status(200).json({ success: true, message: "Medicine deleted" });
  } catch (error) {
    next(error);
  }
};

// @desc    Get ALL medicines including blocked ones (admin dashboard)
// @route   GET /api/medicines/admin/all
// @access  Private
const getAllMedicinesAdmin = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.category) filter.category = req.query.category;
    if (req.query.isBlocked !== undefined) filter.isBlocked = req.query.isBlocked === "true";

    const [medicines, total] = await Promise.all([
      Medicine.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Medicine.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: medicines,
    });
  } catch (error) {
    next(error);
  }
};

// @desc  Auto-enrich and create medicine from web search
// @route POST /api/medicines/enrich
// @access Public (called from scanner)
const enrichMedicine = async (req, res, next) => {
  try {
    const { medicineName, apiKey, country } = req.body;
    if (!medicineName) return res.status(400).json({ success: false, message: "medicineName required" });
    if (!apiKey)       return res.status(400).json({ success: false, message: "apiKey required" });

    // Dynamically import ES module service
    const { enrichAndCreateMedicine } = await import("../src/services/medicineEnrichment.service.js");
    const result = await enrichAndCreateMedicine(medicineName, apiKey, country || "Bangladesh");

    if (!result.medicine) {
      return res.status(404).json({
        success: false,
        message: result.reason || "Could not find medicine information",
      });
    }

    res.status(result.created ? 201 : 200).json({
      success: true,
      created: result.created,
      data:    result.medicine,
    });
  } catch (error) {
    next(error);
  }
};
const medicineController = {
  addMedicine,
  getAllMedicines,
  searchMedicines,
  getMedicine,
  updateMedicine,
  updateMedicineImage,
  toggleBlockMedicine,
  deleteMedicine,
  getAllMedicinesAdmin,
  enrichMedicine,
};

export default medicineController;