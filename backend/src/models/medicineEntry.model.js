import mongoose from "mongoose";

const medicineEntrySchema = new mongoose.Schema(
  {
    medicine: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Medicine",
      required: [true, "Medicine reference is required"],
    },
    shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: [true, "Shop reference is required"],
    },
    brandName: {
      type: String,
      trim: true, // which brand is available at this shop
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: 0,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    isBlocked: {
      type: Boolean,
      default: false, // admin control
    },
    addedBy: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    // Price vote counts — stored here for fast reads
    priceVotes: {
      correct: { type: Number, default: 0 },
      incorrect: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);
 

const MedicineEntry = mongoose.model("MedicineEntry", medicineEntrySchema);
export default MedicineEntry;