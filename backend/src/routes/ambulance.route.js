import express from "express";
import { 
  getAllAmbulances, 
  getAmbulanceStats, 
  addAmbulance, 
  upvoteAmbulance 
} from "../controllers/ambulance.controller.js";

const router = express.Router();

router.get("/", getAllAmbulances);
router.get("/stats", getAmbulanceStats);
router.post("/add", addAmbulance);
router.patch("/upvote/:id", upvoteAmbulance);

export default router;