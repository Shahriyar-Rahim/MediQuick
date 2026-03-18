import express from "express";
import feedbackController from "../controllers/feedback.controller.js";
import protectMiddleware from "../middlewares/protect.js";

const router = express.Router();

// ── Public ────────────────────────────────────────────────────────────────────
router.post("/", feedbackController.submitFeedback);

// ── Admin only ────────────────────────────────────────────────────────────────
router.use(protectMiddleware.protect);
router.get("/admin/stats",          feedbackController.getFeedbackStats);
router.get("/admin",                feedbackController.getAllFeedback);
router.patch("/admin/read-all",     feedbackController.markAllAsRead);
router.patch("/admin/:id/read",     feedbackController.markAsRead);
router.patch("/admin/:id/archive",  feedbackController.archiveFeedback);
router.delete("/admin/:id",         feedbackController.deleteFeedback);

export default router;