import express from "express";
import medicineEntryController from "../controllers/medicineentry.controller.js";

const router = express.Router();

// ── Static / prefixed routes FIRST ──────────────────────────────
router.get("/trending",                 medicineEntryController.getTrending);
router.get("/admin/all",                medicineEntryController.getAllEntriesAdmin);
router.get("/medicine/:medicineId",     medicineEntryController.getEntriesByMedicine);
router.get("/shop/:shopId",             medicineEntryController.getEntriesByShop);
router.get("/compare/:medicineId",      medicineEntryController.comparePrices);

// ── Root ─────────────────────────────────────────────────────────
router.post("/",                        medicineEntryController.addEntry);
router.get("/",                         medicineEntryController.getAllEntries);

// ── Dynamic :id routes LAST ──────────────────────────────────────
router.get("/:id",                      medicineEntryController.getEntry);
router.patch("/:id",                    medicineEntryController.updateEntry);
router.patch("/:id/block",              medicineEntryController.toggleBlockEntry);
router.delete("/:id",                   medicineEntryController.deleteEntry);

export default router;