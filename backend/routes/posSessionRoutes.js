const express = require("express");
const posSessionController = require("../controllers/posSessionController");

const router = express.Router();

router.get("/active", posSessionController.getActiveSession);
router.post("/start", posSessionController.startSession);
router.get("/aggregate-summary", posSessionController.getAggregateSummary);
router.post("/:id/end", posSessionController.endSession);
router.post("/:id/force-close", posSessionController.forceCloseSession);
router.get("/:id/summary", posSessionController.getSessionSummary);
router.get("/:id/detail", posSessionController.getSessionDetail);

module.exports = router;
