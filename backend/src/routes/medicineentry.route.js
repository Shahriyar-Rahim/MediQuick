import express from "express";
import medicineEntryController from "../controllers/medicineentry.controller.js";

const router = express.Router();

router.post("/add", medicineEntryController.addEntry);
router.get("/entries/medicine/:medicineId", medicineEntryController.getEntriesByMedicine);
router.get("/entries/shop/:shopId", medicineEntryController.getEntriesByShop);
router.get("/entries/:id", medicineEntryController.getEntry);
router.patch("/entries/:id", medicineEntryController.updateEntry);
router.get("/entries/compare", medicineEntryController.comparePrices);
router.get("/entries/trending", medicineEntryController.getTrending);
router.patch("/entries/:id/block", medicineEntryController.toggleBlockEntry);
router.delete("/entries/:id", medicineEntryController.deleteEntry);
router.get("/entries/admin", medicineEntryController.getAllEntriesAdmin);

export default router;