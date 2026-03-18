import express from "express";
import shopController from "../controllers/shop.controller.js";

const router = express.Router();

router.post("/add", shopController.addShop);
router.get("/nearby", shopController.getNearbyShops);
router.get("/shops", shopController.getAllShops);
router.get("/shops/:id", shopController.getShop);
router.patch("/shops/:id", shopController.updateShop);
router.patch("/shops/:id/image", shopController.updateShopImage);
router.patch("/shops/:id/block", shopController.toggleBlockShop);
router.delete("/shops/:id", shopController.deleteShop);
router.get("/shops/admin", shopController.getAllShopsAdmin);

export default router;