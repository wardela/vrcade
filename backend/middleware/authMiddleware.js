const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        message: "Authorization header missing"
      });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({
        message: "Token missing"
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    // ✅ THIS IS CRITICAL
    req.user = decoded;

    next();
  } catch (err) {
  console.error("❌ Auth error:", err.message);

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      code: "TOKEN_EXPIRED",
      message: "Token expired"
    });
  }

  return res.status(401).json({
    message: "Invalid token"
  });
}

};

module.exports = {
  authMiddleware
};
