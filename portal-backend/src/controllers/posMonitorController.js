const posMonitorService = require("../services/posMonitorService");

const parsePositiveId = (value) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
};

const parseOptionalPositiveId = (value) => {
  if (value == null || value === "") {
    return null;
  }

  return parsePositiveId(value) ?? undefined;
};

const handleError = (res, error, fallbackMessage) => {
  if (error?.statusCode) {
    return res.status(error.statusCode).json({
      code: error.code,
      message: error.message,
      details: error.details || undefined,
    });
  }

  console.error(fallbackMessage, error);
  return res.status(500).json({
    message: fallbackMessage,
  });
};

exports.getOverview = async (req, res) => {
  try {
    const payload = await posMonitorService.getPosMonitoringOverview(req.db);
    return res.status(200).json(payload);
  } catch (error) {
    return handleError(res, error, "Failed to load portal POS monitoring");
  }
};

exports.getCompany = async (req, res) => {
  try {
    const payload = await posMonitorService.getMonitoringCompany(req.db);
    return res.status(200).json(payload);
  } catch (error) {
    return handleError(res, error, "Failed to load portal POS company details");
  }
};

exports.getPosPoint = async (req, res) => {
  const posPointId = parsePositiveId(req.params.id);
  if (!posPointId) {
    return res.status(400).json({
      code: "POS_POINT_INVALID_ID",
      message: "Invalid POS station id",
    });
  }

  try {
    const posPoint = await posMonitorService.getPosPointById(req.db, posPointId);

    if (!posPoint) {
      return res.status(404).json({
        code: "POS_POINT_NOT_FOUND",
        message: "POS station not found",
      });
    }

    return res.status(200).json({
      pos_point: posPoint,
    });
  } catch (error) {
    return handleError(res, error, "Failed to load portal POS station");
  }
};

exports.createPosPoint = async (req, res) => {
  try {
    const posPoint = await posMonitorService.createPosPoint(req.db, {
      name: req.body?.name,
      description: req.body?.description,
      isActive: req.body?.is_active,
      code: req.body?.code,
      hasEcr: req.body?.has_ecr,
      ecrMid: req.body?.ecr_mid,
      ecrTid: req.body?.ecr_tid,
      ecrSecureKey: req.body?.ecr_secure_key,
    });

    return res.status(201).json({
      pos_point: posPoint,
    });
  } catch (error) {
    return handleError(res, error, "Failed to create portal POS station");
  }
};

exports.updatePosPoint = async (req, res) => {
  const posPointId = parsePositiveId(req.params.id);
  if (!posPointId) {
    return res.status(400).json({
      code: "POS_POINT_INVALID_ID",
      message: "Invalid POS station id",
    });
  }

  try {
    const posPoint = await posMonitorService.updatePosPoint(req.db, posPointId, {
      name: req.body?.name,
      description: req.body?.description,
      isActive: req.body?.is_active,
      code: req.body?.code,
      hasEcr: req.body?.has_ecr,
      ecrMid: req.body?.ecr_mid,
      ecrTid: req.body?.ecr_tid,
      ecrSecureKey: req.body?.ecr_secure_key,
    });

    return res.status(200).json({
      pos_point: posPoint,
    });
  } catch (error) {
    return handleError(res, error, "Failed to update portal POS station");
  }
};

exports.getPosPointSessions = async (req, res) => {
  const posPointId = parsePositiveId(req.params.id);
  if (!posPointId) {
    return res.status(400).json({
      code: "POS_POINT_INVALID_ID",
      message: "Invalid POS station id",
    });
  }

  try {
    const payload = await posMonitorService.getSessionsForPosPoint(req.db, posPointId);
    return res.status(200).json(payload);
  } catch (error) {
    return handleError(res, error, "Failed to load portal POS station sessions");
  }
};

exports.getSessionDetail = async (req, res) => {
  const sessionId = parsePositiveId(req.params.id);
  if (!sessionId) {
    return res.status(400).json({
      code: "POS_SESSION_INVALID_ID",
      message: "Invalid POS session id",
    });
  }

  try {
    const payload = await posMonitorService.getSessionSummary(req.db, sessionId, {
      includeInvoices: true,
    });

    return res.status(200).json(payload);
  } catch (error) {
    return handleError(res, error, "Failed to load portal POS session details");
  }
};

exports.getSessionSummary = async (req, res) => {
  return exports.getSessionDetail(req, res);
};

exports.getActiveSessions = async (req, res) => {
  try {
    const payload = await posMonitorService.getPosMonitoringOverview(req.db);
    return res.status(200).json({
      active_sessions: payload.active_sessions || [],
    });
  } catch (error) {
    return handleError(res, error, "Failed to load active portal POS sessions");
  }
};

exports.forceCloseSession = async (req, res) => {
  const sessionId = parsePositiveId(req.params.id);
  if (!sessionId) {
    return res.status(400).json({
      code: "POS_SESSION_INVALID_ID",
      message: "Invalid POS session id",
    });
  }

  try {
    const payload = await posMonitorService.forceCloseSession(req.db, {
      sessionId,
      actingUserId: req.user.user_id,
      closingNote: req.body?.closing_note,
      endedAt: req.body?.ended_at,
    });

    return res.status(200).json(payload);
  } catch (error) {
    return handleError(res, error, "Failed to force-close portal POS session");
  }
};

exports.getAggregateSummary = async (req, res) => {
  const posPointId = parseOptionalPositiveId(req.query?.pos_point_id);
  if (posPointId === undefined) {
    return res.status(400).json({
      code: "POS_POINT_INVALID_ID",
      message: "Invalid POS station id",
    });
  }

  try {
    const payload = await posMonitorService.getAggregateSessionSummary(req.db, {
      from: req.query?.from,
      to: req.query?.to,
      posPointId,
    });

    return res.status(200).json(payload);
  } catch (error) {
    return handleError(res, error, "Failed to load portal POS aggregate summary");
  }
};
