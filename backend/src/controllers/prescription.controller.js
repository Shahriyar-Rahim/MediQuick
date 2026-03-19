import Prescription from "../models/prescription.model.js";
import ipHelper from "../utils/ipHelper.js";

const { getHashedIp } = ipHelper;

// @desc   Save a prescription scan result
// @route  POST /api/prescriptions
// @access Public
const savePrescription = async (req, res, next) => {
  try {
    const {
      imageBase64,
      imageUrl,
      geminiRaw,
      confidence,
      geminiNotes,
      detectedMedicines,  // array of enriched medicine objects from frontend
      scanDurationMs,
    } = req.body;

    if (!detectedMedicines || detectedMedicines.length === 0) {
      return res.status(400).json({ success: false, message: "No medicines to save" });
    }

    // Soft rate limit — max 20 scans per IP per day
    const voterIp    = getHashedIp(req);
    const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
    const todayCount = await Prescription.countDocuments({
      voterIp, createdAt: { $gte: startOfDay },
    });
    if (todayCount >= 20) {
      return res.status(429).json({
        success: false,
        message: "Daily scan limit reached. Please try again tomorrow.",
      });
    }

    // Build enriched medicine entries
    const enriched = detectedMedicines.map((m) => {
      const prices     = (m.shopEntries || []).map((e) => e.price).filter(Boolean);
      const inStockCount = (m.shopEntries || []).filter((e) => e.isAvailable).length;
      return {
        detectedName:        m.detectedName,
        medicine:            m.medicineId || null,
        medicineGenericName: m.medicineGenericName || "",
        shopEntries:         m.shopEntries || [],
        lowestPrice:  prices.length ? Math.min(...prices) : null,
        highestPrice: prices.length ? Math.max(...prices) : null,
        avgPrice:     prices.length
          ? parseFloat((prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2))
          : null,
        inStockCount,
      };
    });

    // Build name index for full-text search
    const medicineNameIndex = [
      ...new Set([
        ...enriched.map((m) => m.detectedName),
        ...enriched.map((m) => m.medicineGenericName).filter(Boolean),
      ]),
    ];

    const totalFound    = enriched.filter((m) => m.medicine).length;
    const totalNotFound = enriched.length - totalFound;
    const totalShops    = new Set(
      enriched.flatMap((m) => m.shopEntries.map((e) => e.shop?.toString()))
    ).size;

    const prescription = await Prescription.create({
      imageUrl:      imageUrl      || "",
      imageBase64:   imageBase64   || "",
      geminiRaw:     geminiRaw     || "",
      confidence:    confidence    || "",
      geminiNotes:   geminiNotes   || "",
      detectedMedicines: enriched,
      totalDetected:  enriched.length,
      totalFound,
      totalNotFound,
      totalShops,
      medicineNameIndex,
      voterIp,
      userAgent: req.headers["user-agent"]?.slice(0, 200) || "",
      scanDurationMs: scanDurationMs || 0,
    });

    res.status(201).json({
      success: true,
      message: "Prescription saved",
      data: {
        _id:            prescription._id,
        totalDetected:  prescription.totalDetected,
        totalFound:     prescription.totalFound,
        createdAt:      prescription.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc   Get a single prescription by ID (public — share link)
// @route  GET /api/prescriptions/:id
// @access Public
const getPrescription = async (req, res, next) => {
  try {
    const prescription = await Prescription
      .findById(req.params.id)
      .populate("detectedMedicines.medicine", "genericName brandNames category image")
      .populate("detectedMedicines.shopEntries.shop", "name address location fraudVotes");

    if (!prescription) {
      return res.status(404).json({ success: false, message: "Prescription not found" });
    }

    // Strip base64 from public response (too large)
    const data = prescription.toObject();
    delete data.imageBase64;
    delete data.voterIp;
    delete data.userAgent;

    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

// @desc   Get all prescriptions (admin)
// @route  GET /api/prescriptions/admin?page=1&limit=20
// @access Private
const getAllPrescriptions = async (req, res, next) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip  = (page - 1) * limit;

    const filter = {};
    if (req.query.confidence) filter.confidence = req.query.confidence;

    const [prescriptions, total] = await Promise.all([
      Prescription.find(filter)
        .select("-imageBase64 -geminiRaw -voterIp -userAgent")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Prescription.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: prescriptions,
    });
  } catch (error) {
    next(error);
  }
};

// @desc   Get prescription stats (admin dashboard)
// @route  GET /api/prescriptions/admin/stats
// @access Private
const getPrescriptionStats = async (req, res, next) => {
  try {
    const [
      total,
      todayCount,
      topDetected,
      confidenceBreakdown,
      avgFound,
    ] = await Promise.all([
      Prescription.countDocuments(),

      Prescription.countDocuments({
        createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      }),

      // Most commonly detected medicine names
      Prescription.aggregate([
        { $unwind: "$detectedMedicines" },
        { $group: { _id: "$detectedMedicines.detectedName", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),

      // Confidence breakdown
      Prescription.aggregate([
        { $group: { _id: "$confidence", count: { $sum: 1 } } },
      ]),

      // Average found per scan
      Prescription.aggregate([
        { $group: { _id: null, avgFound: { $avg: "$totalFound" }, avgDetected: { $avg: "$totalDetected" } } },
      ]),
    ]);

    res.status(200).json({
      success: true,
      data: {
        total,
        todayCount,
        topDetected,
        confidenceBreakdown: confidenceBreakdown.reduce((acc, c) => {
          acc[c._id || "unknown"] = c.count; return acc;
        }, {}),
        avgFound:    avgFound[0]?.avgFound    ? parseFloat(avgFound[0].avgFound.toFixed(1))    : 0,
        avgDetected: avgFound[0]?.avgDetected ? parseFloat(avgFound[0].avgDetected.toFixed(1)) : 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc   Delete prescription (admin)
// @route  DELETE /api/prescriptions/admin/:id
// @access Private
const deletePrescription = async (req, res, next) => {
  try {
    const p = await Prescription.findByIdAndDelete(req.params.id);
    if (!p) return res.status(404).json({ success: false, message: "Not found" });
    res.status(200).json({ success: true, message: "Deleted" });
  } catch (error) {
    next(error);
  }
};

export default {
  savePrescription,
  getPrescription,
  getAllPrescriptions,
  getPrescriptionStats,
  deletePrescription,
};
