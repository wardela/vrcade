const express = require("express");
const eventController = require("../controllers/eventController");

const router = express.Router();

router.post("/system-item/ensure", eventController.ensureEventSystemItem);
router.get("/", eventController.listEvents);
router.post("/", eventController.createEvent);
router.get("/:id", eventController.getEventDetails);
router.get("/:id/payments", eventController.getEventPayments);
router.post("/:id/payments", eventController.addEventPayment);

module.exports = router;
