const ecrPaymentService = require("../services/ecrPaymentService");
const posSessionService = require("../services/posSessionService");

const getCurrentUsername = (req) =>
  req.user?.username || req.user?.full_name || req.user?.user_id || "POS";

const sale = async (req, res) => {
  try {
    const referenceNumber = String(req.body?.reference_number || "").trim();
    const invoiceNumber = String(req.body?.invoice_number || referenceNumber).trim();
    const activeSession = await posSessionService.resolveActiveSessionForUser(req.db, {
      userId: req.user?.user_id,
      sessionId: req.body?.session_id,
    });

    const requestedPosPointId =
      req.body?.pos_point_id == null || req.body?.pos_point_id === ""
        ? null
        : Number.parseInt(req.body.pos_point_id, 10);

    if (requestedPosPointId != null && !Number.isInteger(requestedPosPointId)) {
      throw ecrPaymentService.createEcrError(
        "Invalid POS station id",
        400,
        "POS_POINT_INVALID_ID",
      );
    }

    if (requestedPosPointId != null && requestedPosPointId !== Number(activeSession.pos_point_id)) {
      throw ecrPaymentService.createEcrError(
        "Visa terminal payment must use the active POS station",
        409,
        "ECR_POS_POINT_MISMATCH",
      );
    }

    const result = await ecrPaymentService.sale({
      db: req.db,
      posPointId: activeSession.pos_point_id,
      amount: req.body?.amount,
      referenceNumber,
      invoiceNumber,
      tillerUsername: String(req.body?.tiller_username || getCurrentUsername(req)).trim(),
      tillerFullName: String(req.body?.tiller_full_name || getCurrentUsername(req)).trim(),
    });

    return res.status(200).json({ payment: result });
  } catch (error) {
    if (error?.statusCode) {
      return res.status(error.statusCode).json({
        code: error.code,
        message: error.message,
        details: error.details || undefined,
      });
    }

    console.error("ECR payment sale failed:", error);
    return res.status(500).json({ message: "Failed to process ECR payment" });
  }
};

module.exports = {
  sale,
};
