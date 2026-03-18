import express from "express";
import voteController from "../controllers/vote.controller.js";

const router = express.Router();

router.post("/price/:entryId", voteController.votePriceCorrectness);
router.post("/fraud/:shopId", voteController.voteFraud);
router.get("/price/:entryId", voteController.getPriceVotes);
router.get("/fraud/:shopId", voteController.getFraudVotes);
router.get("/check", voteController.checkMyVote);
router.get("/admin/all", voteController.getAllVotesAdmin);
router.delete("/admin/:id", voteController.deleteVote);

export default router;