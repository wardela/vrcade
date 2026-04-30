const express = require("express");
const ecrPaymentController = require("../controllers/ecrPaymentController");

const router = express.Router();

router.post("/sale", ecrPaymentController.sale);

module.exports = router;
