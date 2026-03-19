import mongoose from "mongoose";

const detectedMedicineSchema = new mongoose.Schema({
  // What Gemini detected (raw text from prescription)
  detectedName:   { type: String, required: true, trim: true },

  // Matched medicine in our DB (null if not found)
  medicine:       { type: mongoose.Schema.Types.ObjectId, ref: "Medicine", default: null },
  medicineGenericName: { type: String, default: "" },

  // All shops & prices at time of scan (snapshot for history)
  shopEntries: [{
    shop:        { type: mongoose.Schema.Types.ObjectId, ref: "Shop" },
    shopName:    { type: String },
    shopAddress: { type: String },
    coordinates: { lat: Number, lng: Number },
    price:       { type: Number },
    isAvailable: { type: Boolean },
    brandName:   { type: String },
  }],

  lowestPrice:  { type: Number, default: null },
  highestPrice: { type: Number, default: null },
  avgPrice:     { type: Number, default: null },
  inStockCount: { type: Number, default: 0 },
}, { _id: false });

const prescriptionSchema = new mongoose.Schema(
  {
    // Image stored as base64 or cloudinary URL
    imageUrl:   { type: String, default: "" },   // cloudinary if uploaded
    imageBase64:{ type: String, default: "" },   // fallback — strip after saving url

    // Gemini raw response for future re-analysis
    geminiRaw: { type: String, default: "" },
    confidence:{ type: String, enum: ["high", "medium", "low", ""], default: "" },
    geminiNotes:{ type: String, default: "" },

    // All detected medicines with full enrichment
    detectedMedicines: [detectedMedicineSchema],

    // Quick stats for dashboard indexing
    totalDetected:  { type: Number, default: 0 },
    totalFound:     { type: Number, default: 0 },
    totalNotFound:  { type: Number, default: 0 },
    totalShops:     { type: Number, default: 0 },

    // All unique medicine names detected — for text search indexing
    medicineNameIndex: [{ type: String }],

    // Session / device info for analytics (no PII)
    voterIp:    { type: String, default: "" },
    userAgent:  { type: String, default: "" },
    scanDurationMs: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    // Full text index on detected names for future search
    versionKey: false
  }
);

// Text index for full-text search across prescriptions
prescriptionSchema.index({ medicineNameIndex: "text", geminiNotes: "text" });
// Index for time-based queries
prescriptionSchema.index({ createdAt: -1 });
// Index for IP-based rate limiting
prescriptionSchema.index({ voterIp: 1, createdAt: -1 });

const Prescription = mongoose.model("Prescription", prescriptionSchema);
export default Prescription;
