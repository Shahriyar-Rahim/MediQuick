import express from "express";
import Donor from "../models/donor.model.js";
import BloodRequest from "../models/bloodreq.model.js";

const router = express.Router();

const getGeoQuery = (lat, lng, radius = 50000) => {
  if (!lat || !lng) return null;
  return {
    $near: {
      $geometry: { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] },
      $maxDistance: parseInt(radius)
    }
  };
};

// 1. GET /api/blood/all (Unified or just donors)
// router.get("/all", async (req, res) => {
//   try {
//     const { lat, lng, bloodGroup } = req.query;
//     let query = { isAvailable: true };
//     if (bloodGroup && bloodGroup !== "all") query.bloodGroup = bloodGroup;
    
//     const geo = getGeoQuery(lat, lng);
//     if (geo) query.location = geo;

//     const donors = await Donor.find(query).limit(50);
//     res.json({ success: true, data: donors });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// });

// 2. GET /api/blood/donors (Specifically for donors list)
router.get("/donors", async (req, res) => {
  try {
    const { lat, lng, radius, bloodGroup } = req.query;
    let query = { isAvailable: true };
    if (bloodGroup && bloodGroup !== "all") query.bloodGroup = bloodGroup;

    const geo = getGeoQuery(lat, lng, radius);
    if (geo) query.location = geo;

    const donors = await Donor.find(query).limit(50);
    res.json({ success: true, data: donors });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3. GET /api/blood/requests
router.get("/requests", async (req, res) => {
  try {
    const { lat, lng, radius, status, bloodGroup } = req.query;
    let query = { status: status || "open" };
    if (bloodGroup && bloodGroup !== "all") query.bloodGroup = bloodGroup;

    const geo = getGeoQuery(lat, lng, radius);
    if (geo) query.location = geo;

    const requests = await BloodRequest.find(query).sort({ createdAt: -1 }).limit(50);
    res.json({ success: true, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// // 4. GET /api/blood/donors/stats
// router.get("/donors/stats", async (req, res) => {
//   try {
//     const { lat, lng } = req.query;
//     const total = await Donor.countDocuments({ isAvailable: true });
//     let nearbyCount = 0;

//     const geo = getGeoQuery(lat, lng, 15000); // 15km
//     if (geo) {
//       nearbyCount = await Donor.countDocuments({ isAvailable: true, location: geo });
//     }
    
//     // Optional: Get counts by group
//     const byGroup = await Donor.aggregate([
//       { $match: { isAvailable: true } },
//       { $group: { _id: "$bloodGroup", count: { $sum: 1 } } }
//     ]);

//     res.json({ success: true, data: { total, nearbyCount, byGroup } });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// });

// Register as a donor
router.post("/donors/register", async (req, res) => {
  try {
    const { lat, lng, ...rest } = req.body;

    if (!lat || !lng) {
      return res.status(400).json({ success: false, message: "Location coordinates are required" });
    }

    const donor = await Donor.create({
      ...rest,
      location: {
        type: "Point",
        coordinates: [parseFloat(lng), parseFloat(lat)]
      }
    });
    res.status(201).json({ success: true, data: donor });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Get Donor Stats (for EmergencyCards.jsx)
router.get("/donors/stats", async (req, res) => {
  try {
    const { lat, lng } = req.query;
    const total = await Donor.countDocuments({ isAvailable: true });
    let nearbyCount = 0;

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (!isNaN(latitude) && !isNaN(longitude)) {
      // radiusInKm / 6378.1 is the formula for radians
      const radiusInRadians = 10 / 6378.1; 

      nearbyCount = await Donor.countDocuments({
        isAvailable: true,
        location: {
          $geoWithin: {
            $centerSphere: [[longitude, latitude], radiusInRadians]
          }
        }
      });
    }
    
    res.json({ success: true, data: { total, nearbyCount } });
  } catch (error) {
    console.error("Stats Error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});
// Create a blood request
router.post("/requests/create", async (req, res) => {
  try {
    const { lat, lng, ...rest } = req.body;

    if (!lat || !lng) {
      return res.status(400).json({ success: false, message: "Location coordinates are required" });
    }

    const request = await BloodRequest.create({
      ...rest,
      location: {
        type: "Point",
        coordinates: [parseFloat(lng), parseFloat(lat)]
      }
    });
    res.status(201).json({ success: true, data: request });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Unified Fetch (All donors and open requests)
router.get("/all", async (req, res) => {
  try {
    const { lat, lng, group } = req.query;
    let donorQuery = { isAvailable: true };
    let requestQuery = { status: "open" };

    if (group && group !== "all") {
      donorQuery.bloodGroup = group;
      requestQuery.bloodGroup = group;
    }

    // Geo-spatial sorting if location is provided
    if (lat && lng) {
      const geoQuery = {
        $near: {
          $geometry: { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: 50000
        }
      };
      donorQuery.location = geoQuery;
      requestQuery.location = geoQuery;
    }

    const [donors, requests] = await Promise.all([
      Donor.find(donorQuery).limit(50),
      BloodRequest.find(requestQuery).limit(50)
    ]);

    res.json({ success: true, data: donors });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;