const jwt = require("jsonwebtoken");

module.exports = function adminAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Admin token missing" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, process.env.ADMIN_JWT_SECRET);

    if (!payload || payload.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    req.admin = payload;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid admin token" });
  }
};
