const statisticsService = require("../services/statisticsService");

exports.getStatistics = async (req, res) => {
  try {
    const data = await statisticsService.getStatisticsData(
      req.db,
      req.query.from,
      req.query.to
    );

    return res.json(data);
  } catch (error) {
    console.error("Portal statistics error:", error);
    return res.status(500).json({
      message: "Failed to load portal statistics",
    });
  }
};
