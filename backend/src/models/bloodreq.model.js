import mongoose from "mongoose";

const bloodRequestSchema = new mongoose.Schema(
  {
    patientName:  { type: String, required: true, trim: true },
    age:          { type: Number, default: null },
    phone:        { type: String, required: true, trim: true },
    bloodGroup:   {
      type: String,
      required: true,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
    },
    unitsNeeded:  { type: Number, default: 1, min: 1 },
    hospital:     { type: String, trim: true, default: "" },
    location: {
      type:        { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
    },
    address:      { type: String, trim: true, default: "" },
    description:  { type: String, trim: true, default: "" },
    urgency:      { type: String, enum: ["normal", "urgent", "critical"], default: "urgent" },
    status:       { type: String, enum: ["open", "fulfilled", "closed"], default: "open" },
    voterIp:      { type: String, default: "" },
  },
  { timestamps: true }
);

bloodRequestSchema.index({ location: "2dsphere" });
bloodRequestSchema.index({ bloodGroup: 1, status: 1 });
bloodRequestSchema.index({ createdAt: -1 });

const BloodRequest = mongoose.model("BloodRequest", bloodRequestSchema);
export default BloodRequest;