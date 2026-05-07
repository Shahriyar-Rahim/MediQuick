import { Ambulance } from "../models/ambulance.model.js";

// Fetches all ambulances, optionally filtered by location (geo-spatial)
export const getAllAmbulances = async (req, res) => {
  try {
    const { lat, lng, type } = req.query;
    let query = {};

    if (type && type !== "all") {
      query.serviceType = type;
    }

    // If coordinates provided, sort by proximity
    if (lat && lng) {
      query.location = {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(lng), parseFloat(lat)],
          },
          $maxDistance: 50000, // 50km radius for search
        },
      };
    }

    const ambulances = await Ambulance.find(query).limit(100);
    res.status(200).json({ success: true, data: ambulances });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/ambulance/stats
 * Provides counts for the Emergency Dashboard cards
 */
export const getAmbulanceStats = async (req, res) => {
  try {
    const { lat, lng } = req.query;
    const total = await Ambulance.countDocuments();
    let nearbyCount = 0;

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (!isNaN(latitude) && !isNaN(longitude)) {
      // 10km radius converted to radians (10 / Earth radius 6378.1)
      const radiusInRadians = 10 / 6378.1;

      nearbyCount = await Ambulance.countDocuments({
        location: {
          $geoWithin: {
            $centerSphere: [[longitude, latitude], radiusInRadians],
          },
        },
      });
    }

    res.status(200).json({ success: true, data: { total, nearbyCount } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addAmbulance = async (req, res) => {
  try {
    const { providerName, phone, location, serviceType, address } = req.body;

    if (!location || location.lng === undefined || location.lat === undefined) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Valid location coordinates are required",
        });
    }

    const newAmbulance = await Ambulance.create({
      providerName,
      phone,
      serviceType,
      address,
      location: {
        type: "Point",
        coordinates: [location.lng, location.lat], // [lng, lat] per GeoJSON
      },
      source: "user",
    });

    res.status(201).json({ success: true, data: newAmbulance });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * PATCH /api/ambulance/upvote/:id
 */
export const upvoteAmbulance = async (req, res) => {
  try {
    const ambulance = await Ambulance.findByIdAndUpdate(
      req.params.id,
      { $inc: { upvotes: 1 } },
      { new: true },
    );
    res.status(200).json({ success: true, data: ambulance });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
