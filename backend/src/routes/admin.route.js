import express from "express";
import adminController from "../controllers/admin.controller.js";

const router = express.Router();

router.post("/", adminController.createAccount);
router.get("/", adminController.getAllAccounts);
router.get("/:id", adminController.getAccount);
router.patch("/:id/status", adminController.updateAccountStatus);
router.delete("/:id", adminController.deleteAccount);
router.patch("/me/password", adminController.updatePassword);

export default router;