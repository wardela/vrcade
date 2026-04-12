const express = require("express");
const eventController = require("../controllers/eventController");
const { requireModulePermission } = require("../middleware/requireModulePermission");

const router = express.Router();

router.post(
  "/system-item/ensure",
  requireModulePermission("events", ["add", "edit"]),
  eventController.ensureEventSystemItem,
);
router.get("/", requireModulePermission("events", "view"), eventController.listEvents);
router.post("/", requireModulePermission("events", "add"), eventController.createEvent);
router
  .route("/:id/status")
  .put(requireModulePermission("events", ["add", "edit"]), eventController.updateEventStatus)
  .patch(requireModulePermission("events", ["add", "edit"]), eventController.updateEventStatus)
  .post(requireModulePermission("events", ["add", "edit"]), eventController.updateEventStatus);
router.get("/:id", requireModulePermission("events", "view"), eventController.getEventDetails);
router.put(
  "/:id/amount",
  requireModulePermission("events", ["add", "edit"]),
  eventController.updateEventAmount,
);
router.get("/:id/payments", requireModulePermission("events", "view"), eventController.getEventPayments);
router.post(
  "/:id/payments",
  requireModulePermission("events", ["add", "edit"]),
  eventController.addEventPayment,
);

module.exports = router;
