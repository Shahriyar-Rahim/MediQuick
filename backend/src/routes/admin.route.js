import express from "express";
import adminController from "../controllers/admin.controller.js";

const router = express.Router();

router.post("/accounts", adminController.createAccount);
router.get("/accounts", adminController.getAllAccounts);
router.get("/accounts/:id", adminController.getAccount);
router.patch("/accounts/:id", adminController.updateAccountStatus);
router.delete("/accounts/:id", adminController.deleteAccount);
router.patch("/accounts/me/password", adminController.updatePassword);

export default router;