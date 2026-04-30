const posPointService = require("../services/posPointService");

const parsePosPointId = (value) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
};

const parseBoolean = (value) => {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
};

const handleError = (res, error, fallbackMessage) => {
  if (error?.statusCode) {
    return res.status(error.statusCode).json({
      code: error.code,
      message: error.message,
    });
  }

  console.error(fallbackMessage, error);
  return res.status(500).json({
    message: fallbackMessage,
  });
};

const listPosPoints = async (req, res) => {
  try {
    const activeOnly = parseBoolean(req.query.active_only) === true;
    const posPoints = await posPointService.listPosPoints(req.db, { activeOnly });
    return res.status(200).json({ pos_points: posPoints });
  } catch (error) {
    return handleError(res, error, "Failed to load POS stations");
  }
};

const getPosPoint = async (req, res) => {
  const posPointId = parsePosPointId(req.params.id);
  if (!posPointId) {
    return res.status(400).json({
      code: "POS_POINT_INVALID_ID",
      message: "Invalid POS station id",
    });
  }

  try {
    const posPoint = await posPointService.getPosPointById(req.db, posPointId);
    if (!posPoint) {
      return res.status(404).json({
        code: "POS_POINT_NOT_FOUND",
        message: "POS station not found",
      });
    }

    return res.status(200).json({ pos_point: posPoint });
  } catch (error) {
    return handleError(res, error, "Failed to load POS station");
  }
};

const getMonitoringList = async (req, res) => {
  try {
    const posPoints = await posPointService.getPosPointMonitoringList(req.db);
    return res.status(200).json({ pos_points: posPoints });
  } catch (error) {
    return handleError(res, error, "Failed to load POS monitoring");
  }
};

const createPosPoint = async (req, res) => {
  try {
    const posPoint = await posPointService.createPosPoint(req.db, {
      name: req.body?.name,
      description: req.body?.description,
      isActive: req.body?.is_active,
      code: req.body?.code,
      hasEcr: req.body?.has_ecr,
      ecrMid: req.body?.ecr_mid,
      ecrTid: req.body?.ecr_tid,
      ecrSecureKey: req.body?.ecr_secure_key,
    });

    return res.status(201).json({ pos_point: posPoint });
  } catch (error) {
    return handleError(res, error, "Failed to create POS station");
  }
};

const updatePosPoint = async (req, res) => {
  const posPointId = parsePosPointId(req.params.id);
  if (!posPointId) {
    return res.status(400).json({
      code: "POS_POINT_INVALID_ID",
      message: "Invalid POS station id",
    });
  }

  try {
    const posPoint = await posPointService.updatePosPoint(req.db, posPointId, {
      name: req.body?.name,
      description: req.body?.description,
      isActive: req.body?.is_active,
      code: req.body?.code,
      hasEcr: req.body?.has_ecr,
      ecrMid: req.body?.ecr_mid,
      ecrTid: req.body?.ecr_tid,
      ecrSecureKey: req.body?.ecr_secure_key,
    });

    return res.status(200).json({ pos_point: posPoint });
  } catch (error) {
    return handleError(res, error, "Failed to update POS station");
  }
};

const getPosPointSessions = async (req, res) => {
  const posPointId = parsePosPointId(req.params.id);
  if (!posPointId) {
    return res.status(400).json({
      code: "POS_POINT_INVALID_ID",
      message: "Invalid POS station id",
    });
  }

  try {
    const payload = await posPointService.getSessionsForPosPoint(req.db, posPointId);
    return res.status(200).json(payload);
  } catch (error) {
    return handleError(res, error, "Failed to load POS station sessions");
  }
};

module.exports = {
  createPosPoint,
  getPosPoint,
  getMonitoringList,
  getPosPointSessions,
  listPosPoints,
  updatePosPoint,
};
