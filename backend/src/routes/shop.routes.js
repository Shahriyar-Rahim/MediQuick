import express from "express";
import shopController from "../controllers/shop.controller.js";

const router = express.Router();

router.post("/", shopController.addShop);
router.get("/nearby", shopController.getNearbyShops);
router.get("/", shopController.getAllShops);
router.get("/:id", shopController.getShop);
router.patch("/:id", shopController.updateShop);
router.patch("/:id/image", shopController.updateShopImage);
router.patch("/:id/block", shopController.toggleBlockShop);
router.delete("/:id", shopController.deleteShop);
router.get("/admin/all", shopController.getAllShopsAdmin);

export default router;