import mongoose from "mongoose";

//User-submitted ambulance providers
const ambulanceSchema = new mongoose.Schema(
  {
    providerName:  { type: String, required: true, trim: true },
    phone:         { type: String, required: true, trim: true },
    altPhone:      { type: String, trim: true, default: "" },
    serviceType:   {
      type: String,
      enum: ["government", "private", "ngo", "hospital", "other"],
      default: "private",
    },
    isAvailable:   { type: Boolean, default: true },
    available24h:  { type: Boolean, default: false },
    location: {
      type:        { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
    },
    address:       { type: String, trim: true, default: "" },
    area:          { type: String, trim: true, default: "" }, // e.g. "Mirpur, Dhaka"
    acAvailable:   { type: Boolean, default: false },
    icuAvailable:  { type: Boolean, default: false },
    charge:        { type: String, trim: true, default: "" }, // e.g. "500-1000 BDT"
    notes:         { type: String, trim: true, default: "" },
    upvotes:       { type: Number, default: 0 },
    isVerified:    { type: Boolean, default: false }, // admin verified
    voterIp:       { type: String, default: "" },
    source:        { type: String, enum: ["user", "cached_api", "admin"], default: "user" },
  },
  { timestamps: true }
);

ambulanceSchema.index({ location: "2dsphere" });
ambulanceSchema.index({ isAvailable: 1, serviceType: 1 });
ambulanceSchema.index({ createdAt: -1 });

//Cached GPS-based provider results (from external APIs)
const ambulanceCacheSchema = new mongoose.Schema(
  {
    // Grid cell key for caching: "lat_lng" rounded to 2 decimal places
    cacheKey:   { type: String, required: true, unique: true },
    lat:        { type: Number, required: true },
    lng:        { type: Number, required: true },
    results:    { type: Array,  default: [] }, // raw Nominatim/OSM results
    fetchedAt:  { type: Date,   default: Date.now },
    expiresAt:  { type: Date,   default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) }, // 24h
  },
  { timestamps: false }
);

ambulanceCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

export const Ambulance      = mongoose.model("Ambulance",      ambulanceSchema);
export const AmbulanceCache = mongoose.model("AmbulanceCache", ambulanceCacheSchema);