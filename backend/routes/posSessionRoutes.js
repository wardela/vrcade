const express = require("express");
const posSessionController = require("../controllers/posSessionController");

const router = express.Router();

router.get("/active", posSessionController.getActiveSession);
router.post("/start", posSessionController.startSession);
router.post("/:id/end", posSessionController.endSession);
router.get("/:id/summary", posSessionController.getSessionSummary);
router.get("/:id/detail", posSessionController.getSessionDetail);

module.exports = router;
