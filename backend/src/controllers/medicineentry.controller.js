import MedicineEntry from "../models/medicineEntry.model.js";
import Medicine from "../models/medicine.model.js";
import Shop from "../models/shop.model.js";


// @desc    Add a medicine entry (public — links medicine + shop + price)
// @route   POST /api/entries


// @access  Public
const addEntry = async (req, res, next) => {
  try {
    const { medicineId, shopId, brandName, price, isAvailable } = req.body;

    if (!medicineId || !shopId || price === undefined) {
      return res.status(400).json({
        success: false,
        message: "medicineId, shopId and price are required",
      });
    }

    // Verify both exist and are not blocked
    const [medicine, shop] = await Promise.all([
      Medicine.findOne({ _id: medicineId, isBlocked: false }),
      Shop.findOne({ _id: shopId, isBlocked: false }),
    ]);

    if (!medicine)
      return res
        .status(404)
        .json({ success: false, message: "Medicine not found or blocked" });
    if (!shop)
      return res
        .status(404)
        .json({ success: false, message: "Shop not found or blocked" });

    // Check if this exact medicine+shop combo already exists
    const existing = await MedicineEntry.findOne({
      medicine: medicineId,
      shop: shopId,
    });
    if (existing) {
      return res.status(400).json({
        success: false,
        message:
          "Entry already exists for this medicine in this shop. Update it instead.",
        data: existing,
      });
    }

    const entry = await MedicineEntry.create({
      medicine: medicineId,
      shop: shopId,
      brandName: brandName || "",
      price: parseFloat(price),
      isAvailable: isAvailable !== undefined ? isAvailable : true,
      addedBy: req.admin ? "admin" : "user",
    });

    await entry.populate(["medicine", "shop"]);

    res
      .status(201)
      .json({ success: true, message: "Entry added", data: entry });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all entries for a specific medicine (public)
//          Shows which shops carry it and at what price
// @route   GET /api/entries/medicine/:medicineId
// @access  Public
const getEntriesByMedicine = async (req, res, next) => {
  try {
    const entries = await MedicineEntry.find({
      medicine: req.params.medicineId,
      isBlocked: false,
    })
      .populate("shop", "name address contact location fraudVotes")
      .sort({ price: 1 }); // cheapest first

    res
      .status(200)
      .json({ success: true, count: entries.length, data: entries });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all entries for a specific shop (public — shown when user clicks shop on map)
// @route   GET /api/entries/shop/:shopId
// @access  Public
const getEntriesByShop = async (req, res, next) => {
  try {
    const { category } = req.query;

    const filter = { shop: req.params.shopId, isBlocked: false };

    let entries = await MedicineEntry.find(filter)
      .populate("medicine", "genericName brandNames category image")
      .sort({ "medicine.genericName": 1 });

    // Filter by category after populate
    if (category) {
      entries = entries.filter((e) => e.medicine?.category === category);
    }

    res
      .status(200)
      .json({ success: true, count: entries.length, data: entries });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single entry by ID (public)
// @route   GET /api/entries/:id
// @access  Public
const getEntry = async (req, res, next) => {
  try {
    const entry = await MedicineEntry.findOne({
      _id: req.params.id,
      isBlocked: false,
    })
      .populate("medicine", "genericName brandNames category description image")
      .populate("shop", "name address contact location");

    if (!entry) {
      return res
        .status(404)
        .json({ success: false, message: "Entry not found" });
    }

    res.status(200).json({ success: true, data: entry });
  } catch (error) {
    next(error);
  }
};

// @desc    Update entry — price or availability (public)
// @route   PATCH /api/entries/:id
// @access  Public
const updateEntry = async (req, res, next) => {
  try {
    const { price, isAvailable, brandName } = req.body;

    const entry = await MedicineEntry.findById(req.params.id);
    if (!entry) {
      return res
        .status(404)
        .json({ success: false, message: "Entry not found" });
    }

    if (entry.isBlocked && !req.admin) {
      return res
        .status(403)
        .json({ success: false, message: "This entry is blocked" });
    }

    if (price !== undefined) entry.price = parseFloat(price);
    if (isAvailable !== undefined) entry.isAvailable = isAvailable;
    if (brandName) entry.brandName = brandName;

    await entry.save();

    res
      .status(200)
      .json({ success: true, message: "Entry updated", data: entry });
  } catch (error) {
    next(error);
  }
};

// @desc    Price comparison — all shops for a medicine sorted by price (public)
// @route   GET /api/entries/compare/:medicineId
// @access  Public
const comparePrices = async (req, res, next) => {
  try {
    const entries = await MedicineEntry.find({
      medicine: req.params.medicineId,
      isBlocked: false,
      isAvailable: true,
    })
      .populate("shop", "name address location")
      .sort({ price: 1 });

    if (!entries.length) {
      return res
        .status(404)
        .json({
          success: false,
          message: "No price data found for this medicine",
        });
    }

    const lowest = entries[0].price;
    const highest = entries[entries.length - 1].price;

    const result = entries.map((e) => ({
      entryId: e._id,
      shop: e.shop,
      brandName: e.brandName,
      price: e.price,
      priceVotes: e.priceVotes,
      priceDifferenceFromLowest: parseFloat((e.price - lowest).toFixed(2)),
    }));

    res.status(200).json({
      success: true,
      count: result.length,
      lowestPrice: lowest,
      highestPrice: highest,
      priceGap: parseFloat((highest - lowest).toFixed(2)),
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get trending medicine entries — most bought/viewed today (public)
// @route   GET /api/entries/trending
// @access  Public
const getTrending = async (req, res, next) => {
  try {
    // Trending = entries updated most recently today (proxy for activity)
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const entries = await MedicineEntry.find({
      isBlocked: false,
      updatedAt: { $gte: startOfDay },
    })
      .populate("medicine", "genericName brandNames category image")
      .populate("shop", "name")
      .sort({ updatedAt: -1 })
      .limit(10);

    res
      .status(200)
      .json({ success: true, count: entries.length, data: entries });
  } catch (error) {
    next(error);
  }
};

// ─── ADMIN ONLY ────────────────────────────────────────────────────────────────

// @desc    Block / unblock an entry (admin)
// @route   PATCH /api/entries/:id/block
// @access  Private
const toggleBlockEntry = async (req, res, next) => {
  try {
    const entry = await MedicineEntry.findById(req.params.id);
    if (!entry) {
      return res
        .status(404)
        .json({ success: false, message: "Entry not found" });
    }

    entry.isBlocked = !entry.isBlocked;
    await entry.save();

    res.status(200).json({
      success: true,
      message: `Entry ${entry.isBlocked ? "blocked" : "unblocked"}`,
      data: entry,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete an entry (admin)
// @route   DELETE /api/entries/:id
// @access  Private
const deleteEntry = async (req, res, next) => {
  try {
    const entry = await MedicineEntry.findByIdAndDelete(req.params.id);
    if (!entry) {
      return res
        .status(404)
        .json({ success: false, message: "Entry not found" });
    }

    res.status(200).json({ success: true, message: "Entry deleted" });
  } catch (error) {
    next(error);
  }
};

// @desc    Get ALL entries including blocked (admin dashboard)
// @route   GET /api/entries/admin/all
// @access  Private
const getAllEntriesAdmin = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.isBlocked !== undefined)
      filter.isBlocked = req.query.isBlocked === "true";
    if (req.query.shopId) filter.shop = req.query.shopId;
    if (req.query.medicineId) filter.medicine = req.query.medicineId;

    const [entries, total] = await Promise.all([
      MedicineEntry.find(filter)
        .populate("medicine", "genericName")
        .populate("shop", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      MedicineEntry.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: entries,
    });
  } catch (error) {
    next(error);
  }
};

const getAllEntries = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const page  = parseInt(req.query.page)  || 1;
    const skip  = (page - 1) * limit;

    const [entries, total] = await Promise.all([
      MedicineEntry.find({ isBlocked: false })
        .populate("medicine", "genericName brandNames category image")
        .populate("shop", "name address")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      MedicineEntry.countDocuments({ isBlocked: false }),
    ]);

    res.status(200).json({ success: true, total, page, data: entries });
  } catch (error) {
    next(error);
  }
};
const medicineEntryController = {
  addEntry,
  getAllEntries,
  getEntriesByMedicine,
  getEntriesByShop,
  getEntry,
  updateEntry,
  comparePrices,
  getTrending,
  toggleBlockEntry,
  deleteEntry,
  getAllEntriesAdmin,
};

export default medicineEntryController;