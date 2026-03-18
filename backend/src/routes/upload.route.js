import express from "express";
import uploadController from "../controllers/upload.controller.js";
import upload from "../middlewares/upload.js";

const router = express.Router();

router.post("/medicine/:id", upload.single("image"), uploadController.uploadMedicineImage);
router.post("/shop/:id", upload.single("image"), uploadController.uploadShopImage);
router.delete("/delete", uploadController.deleteImage);

export default router;