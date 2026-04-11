const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { authMiddleware: auth } = require("./middleware/authMiddleware");
const tenantDb = require("./middleware/tenantDb");
const { ensureAllPosSessionSchemas } = require("./utils/ensurePosSessionSchema");
const { startPosSessionAutoCloseScheduler } = require("./utils/posSessionAutoCloseScheduler");

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
];

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-clinic-schema"]
}));

app.use(express.json());

// =============================
// ROUTES
// =============================
const invoiceRoutes = require("./routes/invoiceRoutes");
const eventRoutes = require("./routes/eventRoutes");
const posSessionRoutes = require("./routes/posSessionRoutes");
const posPointRoutes = require("./routes/posPointRoutes");
const userRoutes = require("./routes/userRoutes");
const sessionRoutes = require("./routes/userRoutes");

// =============================
// TENANT ROUTES
// =============================
app.use("/api/invoices", auth, tenantDb, invoiceRoutes);
app.use("/api/events", auth, tenantDb, eventRoutes);
app.use("/api/pos-sessions", auth, tenantDb, posSessionRoutes);
app.use("/api/pos-points", auth, tenantDb, posPointRoutes);
app.use("/api/users", userRoutes);

// =============================
// session active
// =============================
app.use("/api/session", sessionRoutes);

// =============================
// SERVER
// ============================= 
const PORT = process.env.PORT || 3004;

const startServer = async () => {
  try {
    await ensureAllPosSessionSchemas();
    await startPosSessionAutoCloseScheduler();

    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to prepare POS session schema:", error);
    process.exit(1);
  }
};

startServer();
