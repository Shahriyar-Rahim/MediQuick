import express from "express";
import medicineController from "../controllers/medicine.controller.js";

const router = express.Router();

router.post("/", medicineController.addMedicine);
router.get("/", medicineController.getAllMedicines);
router.get("/search", medicineController.searchMedicines);
router.get("/:id", medicineController.getMedicine);
router.patch("/:id", medicineController.updateMedicine);
router.patch("/:id/image", medicineController.updateMedicineImage);
router.patch("/:id/block", medicineController.toggleBlockMedicine);
router.delete("/:id", medicineController.deleteMedicine);
router.get("/admin/all", medicineController.getAllMedicinesAdmin);

export default router;