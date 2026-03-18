import Vote from "../models/vote.model.js";
import MedicineEntry from "../models/medicineEntry.model.js";
import Shop from "../models/shop.model.js";
import getHashedIp from "../utils/ipHelper.js";

// @desc    Vote on a medicine entry price — correct or incorrect (public)
// @route   POST /api/votes/price/:entryId

// @access  Public
const votePriceCorrectness = async (req, res, next) => {
  try {
    const { value } = req.body; // "correct" or "incorrect"

    if (!["correct", "incorrect"].includes(value)) {
      return res.status(400).json({
        success: false,
        message: "value must be 'correct' or 'incorrect'",
      });
    }

    const entry = await MedicineEntry.findOne({
      _id: req.params.entryId,
      isBlocked: false,
    });
    if (!entry) {
      return res
        .status(404)
        .json({ success: false, message: "Entry not found" });
    }

    const voterIp = getHashedIp(req);

    // Check if this IP already voted on this entry
    const existingVote = await Vote.findOne({
      voteType: "price",
      medicineEntry: entry._id,
      voterIp,
    });

    if (existingVote) {
      if (existingVote.value === value) {
        return res.status(400).json({
          success: false,
          message: "You have already voted this way",
        });
      }

      // Remove old vote count, apply new one
      entry.priceVotes[existingVote.value] = Math.max(
        0,
        entry.priceVotes[existingVote.value] - 1,
      );
      entry.priceVotes[value] += 1;
      existingVote.value = value;

      await Promise.all([entry.save(), existingVote.save()]);

      return res.status(200).json({
        success: true,
        message: "Vote updated",
        data: { priceVotes: entry.priceVotes },
      });
    }

    // New vote
    await Vote.create({
      voteType: "price",
      medicineEntry: entry._id,
      value,
      voterIp,
    });

    entry.priceVotes[value] += 1;
    await entry.save();

    res.status(201).json({
      success: true,
      message: "Vote recorded",
      data: { priceVotes: entry.priceVotes },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Vote on a shop — fraud or legit (public)
// @route   POST /api/votes/fraud/:shopId
// @access  Public
const voteFraud = async (req, res, next) => {
  try {
    const { value } = req.body; // "fraud" or "legit"

    if (!["fraud", "legit"].includes(value)) {
      return res.status(400).json({
        success: false,
        message: "value must be 'fraud' or 'legit'",
      });
    }

    const shop = await Shop.findOne({
      _id: req.params.shopId,
      isBlocked: false,
    });
    if (!shop) {
      return res
        .status(404)
        .json({ success: false, message: "Shop not found" });
    }

    const voterIp = getHashedIp(req);

    // Check for existing vote
    const existingVote = await Vote.findOne({
      voteType: "fraud",
      shop: shop._id,
      voterIp,
    });

    if (existingVote) {
      if (existingVote.value === value) {
        return res.status(400).json({
          success: false,
          message: "You have already voted this way",
        });
      }

      // Swap vote
      shop.fraudVotes[existingVote.value] = Math.max(
        0,
        shop.fraudVotes[existingVote.value] - 1,
      );
      shop.fraudVotes[value] += 1;
      existingVote.value = value;

      await Promise.all([shop.save(), existingVote.save()]);

      return res.status(200).json({
        success: true,
        message: "Vote updated",
        data: { fraudVotes: shop.fraudVotes },
      });
    }

    // New vote
    await Vote.create({
      voteType: "fraud",
      shop: shop._id,
      value,
      voterIp,
    });

    shop.fraudVotes[value] += 1;
    await shop.save();

    res.status(201).json({
      success: true,
      message: "Vote recorded",
      data: { fraudVotes: shop.fraudVotes },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get vote summary for a medicine entry (public)
// @route   GET /api/votes/price/:entryId
// @access  Public
const getPriceVotes = async (req, res, next) => {
  try {
    const entry = await MedicineEntry.findById(req.params.entryId).select(
      "priceVotes",
    );
    if (!entry) {
      return res
        .status(404)
        .json({ success: false, message: "Entry not found" });
    }

    const total = entry.priceVotes.correct + entry.priceVotes.incorrect;

    res.status(200).json({
      success: true,
      data: {
        ...entry.priceVotes.toObject(),
        total,
        correctPercent:
          total > 0 ? Math.round((entry.priceVotes.correct / total) * 100) : 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get fraud vote summary for a shop (public)
// @route   GET /api/votes/fraud/:shopId
// @access  Public
const getFraudVotes = async (req, res, next) => {
  try {
    const shop = await Shop.findById(req.params.shopId).select("fraudVotes");
    if (!shop) {
      return res
        .status(404)
        .json({ success: false, message: "Shop not found" });
    }

    const total = shop.fraudVotes.fraud + shop.fraudVotes.legit;
    const FRAUD_THRESHOLD = parseInt(process.env.FRAUD_VOTE_THRESHOLD) || 10;

    res.status(200).json({
      success: true,
      data: {
        ...shop.fraudVotes.toObject(),
        total,
        fraudPercent:
          total > 0 ? Math.round((shop.fraudVotes.fraud / total) * 100) : 0,
        isSuspected: shop.fraudVotes.fraud >= FRAUD_THRESHOLD,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Check if current IP has already voted (public — used to show correct UI state)
// @route   GET /api/votes/check?type=price&targetId=xxx  OR  type=fraud&targetId=xxx
// @access  Public
const checkMyVote = async (req, res, next) => {
  try {
    const { type, targetId } = req.query;

    if (!["price", "fraud"].includes(type) || !targetId) {
      return res
        .status(400)
        .json({
          success: false,
          message: "type (price|fraud) and targetId are required",
        });
    }

    const voterIp = getHashedIp(req);

    const query = { voteType: type, voterIp };
    if (type === "price") query.medicineEntry = targetId;
    if (type === "fraud") query.shop = targetId;

    const vote = await Vote.findOne(query);

    res.status(200).json({
      success: true,
      hasVoted: !!vote,
      currentVote: vote ? vote.value : null,
    });
  } catch (error) {
    next(error);
  }
};

// ─── ADMIN ONLY ────────────────────────────────────────────────────────────────

// @desc    Get all votes (admin — for audit / dashboard)
// @route   GET /api/votes/admin/all?voteType=fraud
// @access  Private
const getAllVotesAdmin = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.voteType) filter.voteType = req.query.voteType;

    const [votes, total] = await Promise.all([
      Vote.find(filter)
        .populate("medicineEntry", "price")
        .populate("shop", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Vote.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: votes,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a specific vote (admin — cleanup)
// @route   DELETE /api/votes/admin/:id
// @access  Private
const deleteVote = async (req, res, next) => {
  try {
    const vote = await Vote.findById(req.params.id);
    if (!vote) {
      return res
        .status(404)
        .json({ success: false, message: "Vote not found" });
    }

    // Sync count on parent document
    if (vote.voteType === "price" && vote.medicineEntry) {
      await MedicineEntry.findByIdAndUpdate(vote.medicineEntry, {
        $inc: { [`priceVotes.${vote.value}`]: -1 },
      });
    }
    if (vote.voteType === "fraud" && vote.shop) {
      await Shop.findByIdAndUpdate(vote.shop, {
        $inc: { [`fraudVotes.${vote.value}`]: -1 },
      });
    }

    await vote.deleteOne();

    res.status(200).json({ success: true, message: "Vote deleted" });
  } catch (error) {
    next(error);
  }
};

const VoteController = {
  votePriceCorrectness,
  voteFraud,
  getPriceVotes,
  getFraudVotes,
  checkMyVote,
  getAllVotesAdmin,
  deleteVote,
};

export default VoteController;