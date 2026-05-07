import mongoose from "mongoose";

const donorSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true, trim: true },
    age:         { type: Number, required: true, min: 18, max: 65 },
    phone:       { type: String, required: true, trim: true },
    bloodGroup:  {
      type: String,
      required: true,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
    },
    location: {
      type:        { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
    },
    address:     { type: String, trim: true, default: "" },
    certificate: { type: String, default: "" }, // cloudinary URL or file path
    isAvailable: { type: Boolean, default: true },
    lastDonated: { type: Date, default: null },
    // Anonymous hashed IP for dedup
    voterIp:     { type: String, default: "" },
  },
  { timestamps: true }
);

donorSchema.index({ location: "2dsphere" });
donorSchema.index({ bloodGroup: 1, isAvailable: 1 });
donorSchema.index({ createdAt: -1 });

const Donor = mongoose.model("Donor", donorSchema);
export default Donor;