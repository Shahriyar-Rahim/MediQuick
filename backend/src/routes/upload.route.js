import express from "express";
import uploadController from "../controllers/upload.controller.js";

const router = express.Router();

router.post("/medicine/:id", uploadController.uploadMedicineImage);
router.post("/shop/:id", uploadController.uploadShopImage);
router.delete("/delete", uploadController.deleteImage);

export default router;