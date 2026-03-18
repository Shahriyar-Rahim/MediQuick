import express from "express";
import medicineController from "../controllers/medicine.controller.js";

const router = express.Router();

router.post("/add", medicineController.addMedicine);
router.get("/medicines", medicineController.getAllMedicines);
router.get("/medicines/search", medicineController.searchMedicines);
router.get("/medicines/:id", medicineController.getMedicine);
router.patch("/medicines/:id", medicineController.updateMedicine);
router.patch("/medicines/:id/image", medicineController.updateMedicineImage);
router.patch("/medicines/:id/block", medicineController.toggleBlockMedicine);
router.delete("/medicines/:id", medicineController.deleteMedicine);
router.get("/medicines/admin", medicineController.getAllMedicinesAdmin);

export default router;