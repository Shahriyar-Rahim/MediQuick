import Medicine from "../models/medicine.model.js";
import MedicineEntry from "../models/medicineEntry.model.js";
import Shop from "../models/shop.model.js";
import Vote from "../models/vote.model.js";
import Admin from "../models/admin.model.js";

// @desc    Main dashboard stats
// @route   GET /api/admin/dashboard
// @access  Private
const getDashboardStats = async (req, res, next) => {
  try {
    const FRAUD_THRESHOLD = parseInt(process.env.FRAUD_VOTE_THRESHOLD) || 10;
 
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
 
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - 7);
 
    const [
      totalMedicines,
      blockedMedicines,
      totalShops,
      blockedShops,
      suspectedFraudShops,
      totalEntries,
      blockedEntries,
      totalVotes,
      todayEntries,
      weekEntries,
      totalAdmins,
    ] = await Promise.all([
      Medicine.countDocuments(),
      Medicine.countDocuments({ isBlocked: true }),
      Shop.countDocuments(),
      Shop.countDocuments({ isBlocked: true }),
      Shop.countDocuments({ "fraudVotes.fraud": { $gte: FRAUD_THRESHOLD }, isBlocked: false }),
      MedicineEntry.countDocuments(),
      MedicineEntry.countDocuments({ isBlocked: true }),
      Vote.countDocuments(),
      MedicineEntry.countDocuments({ createdAt: { $gte: startOfDay } }),
      MedicineEntry.countDocuments({ createdAt: { $gte: startOfWeek } }),
      Admin.countDocuments(),
    ]);
 
    res.status(200).json({
      success: true,
      data: {
        medicines: {
          total: totalMedicines,
          blocked: blockedMedicines,
          active: totalMedicines - blockedMedicines,
        },
        shops: {
          total: totalShops,
          blocked: blockedShops,
          active: totalShops - blockedShops,
          suspectedFraud: suspectedFraudShops,
        },
        entries: {
          total: totalEntries,
          blocked: blockedEntries,
          active: totalEntries - blockedEntries,
          addedToday: todayEntries,
          addedThisWeek: weekEntries,
        },
        votes: {
          total: totalVotes,
        },
        admins: {
          total: totalAdmins,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
 

const getFraudShops = async (req, res, next) => {
  try {
    const FRAUD_THRESHOLD = parseInt(process.env.FRAUD_VOTE_THRESHOLD) || 10;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
 
    const [shops, total] = await Promise.all([
      Shop.find({
        "fraudVotes.fraud": { $gte: FRAUD_THRESHOLD },
        isBlocked: false,
      })
        .sort({ "fraudVotes.fraud": -1 })
        .skip(skip)
        .limit(limit),
      Shop.countDocuments({
        "fraudVotes.fraud": { $gte: FRAUD_THRESHOLD },
        isBlocked: false,
      }),
    ]);
 
    const enriched = shops.map((s) => {
      const total = s.fraudVotes.fraud + s.fraudVotes.legit;
      return {
        ...s.toObject(),
        fraudPercent: total > 0 ? Math.round((s.fraudVotes.fraud / total) * 100) : 0,
      };
    });
 
    res.status(200).json({
      success: true,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: enriched,
    });
  } catch (error) {
    next(error);
  }
};
 

const getPriceDisputes = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
 
    const DISPUTE_THRESHOLD = parseInt(process.env.PRICE_DISPUTE_THRESHOLD) || 5;
 
    const [entries, total] = await Promise.all([
      MedicineEntry.find({
        "priceVotes.incorrect": { $gte: DISPUTE_THRESHOLD },
        isBlocked: false,
      })
        .populate("medicine", "genericName brandNames")
        .populate("shop", "name address")
        .sort({ "priceVotes.incorrect": -1 })
        .skip(skip)
        .limit(limit),
      MedicineEntry.countDocuments({
        "priceVotes.incorrect": { $gte: DISPUTE_THRESHOLD },
        isBlocked: false,
      }),
    ]);
 
    const enriched = entries.map((e) => {
      const total = e.priceVotes.correct + e.priceVotes.incorrect;
      return {
        ...e.toObject(),
        incorrectPercent: total > 0 ? Math.round((e.priceVotes.incorrect / total) * 100) : 0,
      };
    });
 
    res.status(200).json({
      success: true,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: enriched,
    });
  } catch (error) {
    next(error);
  }
};
 

const getGapAnalysis = async (req, res, next) => {
  try {
    // Find all medicines
    const allMedicines = await Medicine.find({ isBlocked: false }).select("genericName brandNames category");
 
    // For each medicine, count how many entries exist
    const results = await Promise.all(
      allMedicines.map(async (med) => {
        const entryCount = await MedicineEntry.countDocuments({
          medicine: med._id,
          isBlocked: false,
          isAvailable: true,
        });
        return {
          medicine: {
            _id: med._id,
            genericName: med.genericName,
            brandNames: med.brandNames,
            category: med.category,
          },
          availableAt: entryCount,
          isRare: entryCount === 0,
        };
      })
    );
 
    results.sort((a, b) => a.availableAt - b.availableAt);
 
    const rare = results.filter((r) => r.isRare);
    const scarce = results.filter((r) => r.availableAt > 0 && r.availableAt <= 2);
    const available = results.filter((r) => r.availableAt > 2);
 
    res.status(200).json({
      success: true,
      summary: {
        totalMedicines: results.length,
        notAvailableAnywhere: rare.length,
        scarce: scarce.length,
        wellAvailable: available.length,
      },
      data: {
        rare,
        scarce,
        available,
      },
    });
  } catch (error) {
    next(error);
  }
};
 

const getTopShops = async (req, res, next) => {
  try {
    const topShops = await MedicineEntry.aggregate([
      { $match: { isBlocked: false } },
      { $group: { _id: "$shop", entryCount: { $sum: 1 } } },
      { $sort: { entryCount: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "shops",
          localField: "_id",
          foreignField: "_id",
          as: "shop",
        },
      },
      { $unwind: "$shop" },
      {
        $project: {
          _id: 0,
          shop: { _id: 1, name: 1, address: 1, location: 1, fraudVotes: 1 },
          entryCount: 1,
        },
      },
    ]);
 
    res.status(200).json({ success: true, count: topShops.length, data: topShops });
  } catch (error) {
    next(error);
  }
};
 

const getTrendingToday = async (req, res, next) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
 
    const trending = await MedicineEntry.aggregate([
      { $match: { updatedAt: { $gte: startOfDay }, isBlocked: false } },
      { $group: { _id: "$medicine", updateCount: { $sum: 1 }, avgPrice: { $avg: "$price" } } },
      { $sort: { updateCount: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "medicines",
          localField: "_id",
          foreignField: "_id",
          as: "medicine",
        },
      },
      { $unwind: "$medicine" },
      {
        $project: {
          _id: 0,
          medicine: { _id: 1, genericName: 1, category: 1, image: 1 },
          updateCount: 1,
          avgPrice: { $round: ["$avgPrice", 2] },
        },
      },
    ]);
 
    res.status(200).json({ success: true, count: trending.length, data: trending });
  } catch (error) {
    next(error);
  }
};

const getRecentActivity = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
 
    const [recentMedicines, recentShops, recentEntries] = await Promise.all([
      Medicine.find().sort({ createdAt: -1 }).limit(limit).select("genericName category addedBy createdAt isBlocked"),
      Shop.find().sort({ createdAt: -1 }).limit(limit).select("name address addedBy createdAt isBlocked"),
      MedicineEntry.find()
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate("medicine", "genericName")
        .populate("shop", "name")
        .select("price isAvailable addedBy createdAt isBlocked"),
    ]);
 
    res.status(200).json({
      success: true,
      data: {
        recentMedicines,
        recentShops,
        recentEntries,
      },
    });
  } catch (error) {
    next(error);
  }
};

const adminDashboard = {
  getDashboardStats,
  getFraudShops,
  getPriceDisputes,
  getGapAnalysis,
  getTopShops,
  getTrendingToday,
  getRecentActivity,
};

export default adminDashboard;