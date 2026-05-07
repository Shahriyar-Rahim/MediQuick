import Shop from "../models/shop.model.js";

const addShop = async (req, res, next) => {
  try {
    const { name, address, contact, latitude, longitude } = req.body;
 
    if (!name) {
      return res.status(400).json({ success: false, message: "Shop name is required" });
    }
    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ success: false, message: "Coordinates (latitude, longitude) are required" });
    }
 
    const shop = await Shop.create({
      name: name.trim(),
      address: address || "",
      contact: contact || "",
      location: {
        type: "Point",
        coordinates: [parseFloat(longitude), parseFloat(latitude)], // GeoJSON: [lng, lat]
      },
      addedBy: req.admin ? "admin" : "user",
    });
 
    res.status(201).json({ success: true, message: "Shop added", data: shop });
  } catch (error) {
    next(error);
  }
};
 
const getNearbyShops = async (req, res, next) => {
  try {
    const { lat, lng, radius } = req.query;
 
    if (!lat || !lng) {
      return res.status(400).json({ success: false, message: "lat and lng are required" });
    }
 
    const radiusInMeters = parseInt(radius) || 5000; // default 5km
 
    const shops = await Shop.find({
      isBlocked: false,
      location: {
        $near: {
          $geometry: { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: radiusInMeters,
        },
      },
    });
 
    res.status(200).json({ success: true, count: shops.length, data: shops });
  } catch (error) {
    next(error);
  }
};
 
const getAllShops = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
 
    const [shops, total] = await Promise.all([
      Shop.find({ isBlocked: false }).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Shop.countDocuments({ isBlocked: false }),
    ]);
 
    res.status(200).json({
      success: true,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: shops,
    });
  } catch (error) {
    next(error);
  }
};

const getShop = async (req, res, next) => {
  try {
    const shop = await Shop.findOne({ _id: req.params.id, isBlocked: false });
 
    if (!shop) {
      return res.status(404).json({ success: false, message: "Shop not found" });
    }
 
    res.status(200).json({ success: true, data: shop });
  } catch (error) {
    next(error);
  }
};

const updateShop = async (req, res, next) => {
  try {
    const { name, address, contact, latitude, longitude } = req.body;
 
    const shop = await Shop.findById(req.params.id);
    if (!shop) {
      return res.status(404).json({ success: false, message: "Shop not found" });
    }
 
    if (shop.isBlocked && !req.admin) {
      return res.status(403).json({ success: false, message: "This shop is blocked" });
    }
 
    if (name) shop.name = name.trim();
    if (address) shop.address = address;
    if (contact) shop.contact = contact;
    if (latitude !== undefined && longitude !== undefined) {
      shop.location = {
        type: "Point",
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
      };
    }
 
    await shop.save();
 
    res.status(200).json({ success: true, message: "Shop updated", data: shop });
  } catch (error) {
    next(error);
  }
};

const updateShopImage = async (req, res, next) => {
  try {
    const { url, publicId } = req.body;
 
    if (!url) {
      return res.status(400).json({ success: false, message: "Image URL is required" });
    }
 
    const shop = await Shop.findByIdAndUpdate(
      req.params.id,
      { image: { url, publicId: publicId || "" } },
      { new: true }
    );
 
    if (!shop) {
      return res.status(404).json({ success: false, message: "Shop not found" });
    }
 
    res.status(200).json({ success: true, message: "Image updated", data: shop });
  } catch (error) {
    next(error);
  }
};
 
//ADMIN ONLY

const toggleBlockShop = async (req, res, next) => {
  try {
    const shop = await Shop.findById(req.params.id);
    if (!shop) {
      return res.status(404).json({ success: false, message: "Shop not found" });
    }
 
    shop.isBlocked = !shop.isBlocked;
    await shop.save();
 
    res.status(200).json({
      success: true,
      message: `Shop ${shop.isBlocked ? "blocked" : "unblocked"}`,
      data: shop,
    });
  } catch (error) {
    next(error);
  }
};

const deleteShop = async (req, res, next) => {
  try {
    const shop = await Shop.findByIdAndDelete(req.params.id);
    if (!shop) {
      return res.status(404).json({ success: false, message: "Shop not found" });
    }
 
    res.status(200).json({ success: true, message: "Shop deleted" });
  } catch (error) {
    next(error);
  }
};

const getAllShopsAdmin = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
 
    const filter = {};
    if (req.query.isBlocked !== undefined) filter.isBlocked = req.query.isBlocked === "true";
 
    // Flag shops with high fraud votes
    const FRAUD_THRESHOLD = parseInt(process.env.FRAUD_VOTE_THRESHOLD) || 10;
 
    const [shops, total] = await Promise.all([
      Shop.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Shop.countDocuments(filter),
    ]);
 
    // Attach a isSuspected flag for the dashboard
    const enriched = shops.map((s) => ({
      ...s.toObject(),
      isSuspected: s.fraudVotes.fraud >= FRAUD_THRESHOLD,
    }));
 
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

const shopController = {
  addShop,
  getNearbyShops,
  getAllShops,
  getShop,
  updateShop,
  updateShopImage,
  toggleBlockShop,
  deleteShop,
  getAllShopsAdmin,
};
 
export default shopController;