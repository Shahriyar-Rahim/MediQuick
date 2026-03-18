import mongoose from "mongoose";

const shopSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Shop name is required"],
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    contact: {
      type: String,
      trim: true,
    },
    // GeoJSON format for Leaflet / MongoDB geo queries
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]  <-- GeoJSON order
        required: [true, "Coordinates are required"],
      },
    },
    image: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    addedBy: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    // Fraud vote counts — stored here for fast map rendering
    fraudVotes: {
      fraud: { type: Number, default: 0 },
      legit: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);
 
// Geospatial index for nearby queries
shopSchema.index({ location: "2dsphere" });

const Shop = mongoose.model("Shop", shopSchema);
export default Shop;