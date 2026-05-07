import Donor from "../models/donor.model.js";
import BloodRequest from "../models/bloodRequest.model.js";
import { getHashedIp } from "../utils/ipHelper.js";

//DONORS

// POST /api/blood/donors
export const registerDonor = async (req, res, next) => {
  try {
    const { name, age, phone, bloodGroup, lat, lng, address, lastDonated } = req.body;
    if (!name || !age || !phone || !bloodGroup)
      return res.status(400).json({ success: false, message: "Name, age, phone and blood group are required" });

    const voterIp = getHashedIp(req);

    // Rate limit: 1 registration per IP per day
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recent = await Donor.countDocuments({ voterIp, createdAt: { $gte: since } });
    if (recent >= 1)
      return res.status(429).json({ success: false, message: "You already registered as a donor today" });

    const donor = await Donor.create({
      name, age: parseInt(age), phone, bloodGroup,
      location: {
        type:        "Point",
        coordinates: [parseFloat(lng) || 0, parseFloat(lat) || 0],
      },
      address:     address || "",
      lastDonated: lastDonated || null,
      certificate: req.body.certificate || "",
      voterIp,
    });

    res.status(201).json({ success: true, data: donor });
  } catch (err) { next(err); }
};

// GET /api/blood/donors?lat=&lng=&radius=&bloodGroup=&page=&limit=
export const getDonors = async (req, res, next) => {
  try {
    const { lat, lng, radius = 10000, bloodGroup, page = 1, limit = 20 } = req.query;

    const filter = { isAvailable: true };
    if (bloodGroup) filter.bloodGroup = bloodGroup;

    let donors;
    if (lat && lng) {
      donors = await Donor.find({
        ...filter,
        location: {
          $near: {
            $geometry:    { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] },
            $maxDistance: parseInt(radius),
          },
        },
      }).limit(parseInt(limit) * parseInt(page));
    } else {
      donors = await Donor.find(filter)
        .sort({ createdAt: -1 })
        .skip((parseInt(page) - 1) * parseInt(limit))
        .limit(parseInt(limit));
    }

    const total = await Donor.countDocuments(filter);
    res.json({ success: true, total, data: donors });
  } catch (err) { next(err); }
};

// GET /api/blood/donors/stats
export const getDonorStats = async (req, res, next) => {
  try {
    const { lat, lng } = req.query;
    const total     = await Donor.countDocuments({ isAvailable: true });
    const byGroup   = await Donor.aggregate([
      { $match: { isAvailable: true } },
      { $group: { _id: "$bloodGroup", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    let nearbyCount = 0;
    if (lat && lng) {
      nearbyCount = await Donor.countDocuments({
        isAvailable: true,
        location: {
          $near: {
            $geometry:    { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] },
            $maxDistance: 10000,
          },
        },
      });
    }

    res.json({ success: true, data: { total, byGroup, nearbyCount } });
  } catch (err) { next(err); }
};

// PATCH /api/blood/donors/:id/availability
export const toggleDonorAvailability = async (req, res, next) => {
  try {
    const donor = await Donor.findByIdAndUpdate(
      req.params.id,
      { isAvailable: req.body.isAvailable },
      { new: true }
    );
    if (!donor) return res.status(404).json({ success: false, message: "Donor not found" });
    res.json({ success: true, data: donor });
  } catch (err) { next(err); }
};

// BLOOD REQUESTS
// POST /api/blood/requests
export const createBloodRequest = async (req, res, next) => {
  try {
    const { patientName, age, phone, bloodGroup, unitsNeeded, hospital, lat, lng, address, description, urgency } = req.body;
    if (!patientName || !phone || !bloodGroup)
      return res.status(400).json({ success: false, message: "Patient name, phone and blood group are required" });

    const voterIp = getHashedIp(req);

    const request = await BloodRequest.create({
      patientName, age: age ? parseInt(age) : null,
      phone, bloodGroup,
      unitsNeeded: unitsNeeded ? parseInt(unitsNeeded) : 1,
      hospital: hospital || "",
      location: {
        type:        "Point",
        coordinates: [parseFloat(lng) || 0, parseFloat(lat) || 0],
      },
      address: address || "", description: description || "",
      urgency: urgency || "urgent",
      voterIp,
    });

    res.status(201).json({ success: true, data: request });
  } catch (err) { next(err); }
};

// GET /api/blood/requests?lat=&lng=&radius=&bloodGroup=&status=&page=&limit=
export const getBloodRequests = async (req, res, next) => {
  try {
    const { lat, lng, radius = 15000, bloodGroup, status = "open", page = 1, limit = 20 } = req.query;

    const filter = {};
    if (status)     filter.status     = status;
    if (bloodGroup) filter.bloodGroup = bloodGroup;

    let requests;
    if (lat && lng) {
      requests = await BloodRequest.find({
        ...filter,
        location: {
          $near: {
            $geometry:    { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] },
            $maxDistance: parseInt(radius),
          },
        },
      }).limit(parseInt(limit) * parseInt(page));
    } else {
      requests = await BloodRequest.find(filter)
        .sort({ createdAt: -1 })
        .skip((parseInt(page) - 1) * parseInt(limit))
        .limit(parseInt(limit));
    }

    const total = await BloodRequest.countDocuments(filter);
    res.json({ success: true, total, data: requests });
  } catch (err) { next(err); }
};

// PATCH /api/blood/requests/:id/status
export const updateRequestStatus = async (req, res, next) => {
  try {
    const request = await BloodRequest.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    if (!request) return res.status(404).json({ success: false, message: "Request not found" });
    res.json({ success: true, data: request });
  } catch (err) { next(err); }
};