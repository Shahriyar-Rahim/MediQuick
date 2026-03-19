import express from "express";
import prescriptionController from "../controllers/prescription.controller.js";
import protectMiddleware from "../middlewares/protect.js";

const router = express.Router();

// ── Public ────────────────────────────────────────────────────────────────────
router.post("/",         prescriptionController.savePrescription);
router.get("/:id",       prescriptionController.getPrescription);

// ── Admin ─────────────────────────────────────────────────────────────────────
router.use(protectMiddleware.protect);
router.get("/admin/stats", prescriptionController.getPrescriptionStats);
router.get("/admin",       prescriptionController.getAllPrescriptions);
router.delete("/admin/:id",prescriptionController.deletePrescription);

export default router;
