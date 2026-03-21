import express from "express";
import medicineController from "../controllers/medicine.controller.js";

import protectMiddleware from "../middlewares/protect.js";

const router = express.Router();


router.get("/search", medicineController.searchMedicines);
router.get("/admin/all", protectMiddleware.protect ,protectMiddleware.superAdminOnly, medicineController.getAllMedicinesAdmin);
router.post("/", medicineController.addMedicine);
router.get("/", medicineController.getAllMedicines);
router.patch("/enrich", medicineController.enrichMedicine);
router.get("/:id", medicineController.getMedicine);
router.patch("/:id", medicineController.updateMedicine);
router.patch("/:id/image", medicineController.updateMedicineImage);


router.patch("/:id/block", protectMiddleware.protect, medicineController.toggleBlockMedicine);
router.delete("/:id", protectMiddleware.protect, medicineController.deleteMedicine);


export default router;