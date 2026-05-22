const dashboardService = require("../services/dashboardService");

exports.getDashboard = async (req, res) => {
  try {
    const data = await dashboardService.getDashboardData(req.db, req.query.date);
    return res.json(data);
  } catch (error) {
    console.error("Portal dashboard error:", error);
    return res.status(500).json({
      message: "Failed to load portal dashboard",
    });
  }
};
