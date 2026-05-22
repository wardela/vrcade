const path = require("path");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const pool = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const portalRoutes = require("./routes/portalRoutes");
const { authMiddleware } = require("./middleware/authMiddleware");
const tenantDb = require("./middleware/tenantDb");

dotenv.config({
  path: path.resolve(__dirname, "../.env"),
});

const app = express();
const port = Number(process.env.PORT || 3008);
const frontendOrigin = process.env.FRONTEND_ORIGIN || "http://localhost:5174";

app.use(
  cors({
    origin: frontendOrigin,
  })
);
app.use(express.json());

app.get("/api/health", async (_req, res) => {
  try {
    const result = await pool.query(
      "SELECT current_database() AS database, NOW() AS server_time"
    );

    res.json({
      ok: true,
      app: "portal-backend",
      port,
      frontendOrigin,
      database: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      app: "portal-backend",
      error: error.message,
    });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/portal", authMiddleware, tenantDb, portalRoutes);

app.use((error, _req, res, _next) => {
  res.status(500).json({
    ok: false,
    error: error.message || "Unexpected server error",
  });
});

const startServer = async () => {
  try {
    await pool.query("SELECT 1");
    app.listen(port, () => {
      console.log(`portal-backend listening on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Failed to start portal-backend:", error.message);
    process.exit(1);
  }
};

startServer();
