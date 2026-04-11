const posSessionService = require("../services/posSessionService");

const parseSessionId = (value) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
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

const getActiveSession = async (req, res) => {
  try {
    const payload = await posSessionService.getActiveSessionStatusForUser(
      req.db,
      {
        userId: req.user.user_id,
        lastSessionId: req.query?.last_session_id,
      },
    );

    return res.status(200).json(payload);
  } catch (error) {
    return handleError(res, error, "Failed to load active POS session");
  }
};

const startSession = async (req, res) => {
  try {
    const result = await posSessionService.startSession(req.db, {
      userId: req.user.user_id,
      posPointId: req.body?.pos_point_id,
      openingNote: req.body?.opening_note,
      startedAt: req.body?.started_at,
    });

    return res.status(result.already_active ? 200 : 201).json(result);
  } catch (error) {
    return handleError(res, error, "Failed to start POS session");
  }
};

const endSession = async (req, res) => {
  const sessionId = parseSessionId(req.params.id);
  if (!sessionId) {
    return res.status(400).json({
      code: "POS_SESSION_INVALID_ID",
      message: "Invalid POS session id",
    });
  }

  try {
    const summary = await posSessionService.endSession(req.db, {
      sessionId,
      userId: req.user.user_id,
      closingNote: req.body?.closing_note,
      endedAt: req.body?.ended_at,
    });

    return res.status(200).json(summary);
  } catch (error) {
    return handleError(res, error, "Failed to end POS session");
  }
};

const getSessionSummary = async (req, res) => {
  const sessionId = parseSessionId(req.params.id);
  if (!sessionId) {
    return res.status(400).json({
      code: "POS_SESSION_INVALID_ID",
      message: "Invalid POS session id",
    });
  }

  try {
    const summary = await posSessionService.getSessionSummary(req.db, sessionId, {
      userId: req.user.user_id,
      requireOwner: true,
      includeInvoices: true,
    });

    return res.status(200).json(summary);
  } catch (error) {
    return handleError(res, error, "Failed to load POS session summary");
  }
};

const getSessionDetail = async (req, res) => {
  const sessionId = parseSessionId(req.params.id);
  if (!sessionId) {
    return res.status(400).json({
      code: "POS_SESSION_INVALID_ID",
      message: "Invalid POS session id",
    });
  }

  try {
    const summary = await posSessionService.getSessionSummary(req.db, sessionId, {
      requireOwner: false,
      includeInvoices: true,
    });

    return res.status(200).json(summary);
  } catch (error) {
    return handleError(res, error, "Failed to load POS session details");
  }
};

const forceCloseSession = async (req, res) => {
  const sessionId = parseSessionId(req.params.id);
  if (!sessionId) {
    return res.status(400).json({
      code: "POS_SESSION_INVALID_ID",
      message: "Invalid POS session id",
    });
  }

  try {
    const summary = await posSessionService.forceCloseSession(req.db, {
      sessionId,
      actingUserId: req.user.user_id,
      closingNote: req.body?.closing_note,
      endedAt: req.body?.ended_at,
    });

    return res.status(200).json(summary);
  } catch (error) {
    return handleError(res, error, "Failed to force-close POS session");
  }
};

const getAggregateSummary = async (req, res) => {
  try {
    await posSessionService.assertUserHasPosPermission(req.db, req.user.user_id, "view");
    const summary = await posSessionService.getAggregateSessionSummary(req.db, {
      from: req.query?.from,
      to: req.query?.to,
    });

    return res.status(200).json(summary);
  } catch (error) {
    return handleError(res, error, "Failed to load POS aggregate summary");
  }
};

module.exports = {
  endSession,
  forceCloseSession,
  getActiveSession,
  getAggregateSummary,
  getSessionDetail,
  getSessionSummary,
  startSession,
};
