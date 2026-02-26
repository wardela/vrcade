const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());

app.use(express.json());

// =============================
// MIDDLEWARE
// =============================
const { authMiddleware: auth } = require("./middleware/authMiddleware");
const tenantDb = require("./middleware/tenantDb");

// =============================
// ROUTES
// =============================
const invoiceRoutes = require("./routes/invoiceRoutes");
const userRoutes = require("./routes/userRoutes");
const sessionRoutes = require("./routes/userRoutes");

// =============================
// TENANT ROUTES
// =============================
app.use("/api/invoices", auth, tenantDb, invoiceRoutes);
app.use("/api/users", userRoutes);

// =============================
// session active
// =============================
app.use("/api/session", sessionRoutes);

// =============================
// SERVER
// ============================= 
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
