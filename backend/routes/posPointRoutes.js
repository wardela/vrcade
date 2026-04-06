const express = require("express");
const posPointController = require("../controllers/posPointController");

const router = express.Router();

router.get("/monitoring", posPointController.getMonitoringList);
router.get("/", posPointController.listPosPoints);
router.post("/", posPointController.createPosPoint);
router.put("/:id", posPointController.updatePosPoint);
router.get("/:id/sessions", posPointController.getPosPointSessions);

module.exports = router;
