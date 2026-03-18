import Feedback from "../models/feedback.model.js";
import ipHelper from "../utils/ipHelper.js";

const { getHashedIp } = ipHelper;

// @desc    Submit feedback (public — no login needed)
// @route   POST /api/feedback
// @access  Public
const submitFeedback = async (req, res, next) => {
  try {
    const { name, message, rating, type } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({ success: false, message: "Message is required" });
    }

    // Soft rate limit — 3 feedbacks per IP per day
    const voterIp   = getHashedIp(req);
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const todayCount = await Feedback.countDocuments({
      voterIp,
      createdAt: { $gte: startOfDay },
    });

    if (todayCount >= 3) {
      return res.status(429).json({
        success: false,
        message: "You have submitted too many feedbacks today. Please try again tomorrow.",
      });
    }

    const feedback = await Feedback.create({
      name:    name?.trim() || "Anonymous",
      message: message.trim(),
      rating:  rating || null,
      type:    type   || "general",
      voterIp,
    });

    res.status(201).json({
      success: true,
      message: "Thank you for your feedback!",
      data: {
        _id:     feedback._id,
        name:    feedback.name,
        type:    feedback.type,
        rating:  feedback.rating,
        message: feedback.message,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all feedbacks (admin)
// @route   GET /api/feedback/admin?page=1&type=bug&isRead=false
// @access  Private
const getAllFeedback = async (req, res, next) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip  = (page - 1) * limit;

    const filter = { isArchived: false };
    if (req.query.type)    filter.type   = req.query.type;
    if (req.query.isRead !== undefined)
      filter.isRead = req.query.isRead === "true";

    const [feedbacks, total, unread] = await Promise.all([
      Feedback.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Feedback.countDocuments(filter),
      Feedback.countDocuments({ isRead: false, isArchived: false }),
    ]);

    res.status(200).json({
      success: true,
      total,
      unread,
      page,
      pages: Math.ceil(total / limit),
      data: feedbacks,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark feedback as read (admin)
// @route   PATCH /api/feedback/admin/:id/read
// @access  Private
const markAsRead = async (req, res, next) => {
  try {
    const feedback = await Feedback.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );
    if (!feedback)
      return res.status(404).json({ success: false, message: "Feedback not found" });

    res.status(200).json({ success: true, data: feedback });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark all unread as read (admin)
// @route   PATCH /api/feedback/admin/read-all
// @access  Private
const markAllAsRead = async (req, res, next) => {
  try {
    await Feedback.updateMany({ isRead: false }, { isRead: true });
    res.status(200).json({ success: true, message: "All marked as read" });
  } catch (error) {
    next(error);
  }
};

// @desc    Archive feedback (admin — soft delete)
// @route   PATCH /api/feedback/admin/:id/archive
// @access  Private
const archiveFeedback = async (req, res, next) => {
  try {
    const feedback = await Feedback.findByIdAndUpdate(
      req.params.id,
      { isArchived: true },
      { new: true }
    );
    if (!feedback)
      return res.status(404).json({ success: false, message: "Feedback not found" });

    res.status(200).json({ success: true, message: "Feedback archived" });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete feedback permanently (admin)
// @route   DELETE /api/feedback/admin/:id
// @access  Private
const deleteFeedback = async (req, res, next) => {
  try {
    const feedback = await Feedback.findByIdAndDelete(req.params.id);
    if (!feedback)
      return res.status(404).json({ success: false, message: "Feedback not found" });

    res.status(200).json({ success: true, message: "Feedback deleted" });
  } catch (error) {
    next(error);
  }
};

// @desc    Get feedback summary stats (admin dashboard widget)
// @route   GET /api/feedback/admin/stats
// @access  Private
const getFeedbackStats = async (req, res, next) => {
  try {
    const [total, unread, byType, avgRating] = await Promise.all([
      Feedback.countDocuments({ isArchived: false }),
      Feedback.countDocuments({ isRead: false, isArchived: false }),
      Feedback.aggregate([
        { $match: { isArchived: false } },
        { $group: { _id: "$type", count: { $sum: 1 } } },
      ]),
      Feedback.aggregate([
        { $match: { rating: { $ne: null }, isArchived: false } },
        { $group: { _id: null, avg: { $avg: "$rating" } } },
      ]),
    ]);

    const typeMap = byType.reduce((acc, t) => {
      acc[t._id] = t.count;
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      data: {
        total,
        unread,
        byType: typeMap,
        avgRating: avgRating[0]?.avg
          ? parseFloat(avgRating[0].avg.toFixed(1))
          : null,
      },
    });
  } catch (error) {
    next(error);
  }
};

export default {
  submitFeedback,
  getAllFeedback,
  markAsRead,
  markAllAsRead,
  archiveFeedback,
  deleteFeedback,
  getFeedbackStats,
};