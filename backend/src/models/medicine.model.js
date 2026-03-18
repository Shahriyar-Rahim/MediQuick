import mongoose from "mongoose";

const medicineSchema = new mongoose.Schema(
  {
    genericName: {
      type: String,
      required: [true, "Generic name is required"],
      trim: true,
      lowercase: true, // stored lowercase for easy search
    },
    brandNames: [
      {
        type: String,
        trim: true,
      },
    ],
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: [
        "antibiotic",
        "antifungal",
        "antiviral",
        "analgesic",
        "antacid",
        "antidiabetic",
        "antihypertensive",
        "antihistamine",
        "vitamin",
        "supplement",
        "other",
      ],
      default: "other",
    },
    description: {
      type: String,
      trim: true,
    },
    image: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" }, // for cloudinary deletion
    },
    isBlocked: {
      type: Boolean,
      default: false, // admin can block, hides from public
    },
    addedBy: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
  },
  { timestamps: true }
);
 
// Full-text search index on genericName and brandNames
medicineSchema.index({ genericName: "text", brandNames: "text" });

const Medicine = mongoose.model("Medicine", medicineSchema);
export default Medicine;