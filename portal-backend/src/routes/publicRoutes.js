const express = require("express");
const publicController = require("../controllers/publicController");
const offerRequestController = require("../controllers/offerRequestController");

const router = express.Router();

router.post("/contact-submissions", publicController.submitContactForm);
router.post("/offer-requests", offerRequestController.submitOfferRequest);

module.exports = router;
