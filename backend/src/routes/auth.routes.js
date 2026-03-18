import express from "express";
import authController from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/login", authController.login);
router.get("/me", authController.getMe);

export default router;