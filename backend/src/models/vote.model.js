import mongoose from "mongoose";

const voteSchema = new mongoose.Schema(
  {
    // what type of vote is this
    voteType: {
      type: String,
      enum: ["price", "fraud"],
      required: true,
    },
 
    // for price votes — points to a MedicineEntry
    medicineEntry: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MedicineEntry",
      default: null,
    },
 
    // for fraud votes — points to a Shop
    shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      default: null,
    },
 
    // price vote: "correct" | "incorrect"
    // fraud vote: "fraud"   | "legit"
    value: {
      type: String,
      enum: ["correct", "incorrect", "fraud", "legit"],
      required: true,
    },
 
    // IP stored as hash in production — used to soft-prevent duplicate votes
    voterIp: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

voteSchema.index({ voteType: 1, medicineEntry: 1, voterIp: 1 }, { unique: true, sparse: true });
voteSchema.index({ voteType: 1, shop: 1, voterIp: 1 }, { unique: true, sparse: true });
 

const Vote = mongoose.model("Vote", voteSchema);
export default Vote;