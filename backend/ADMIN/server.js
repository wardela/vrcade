import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import tenantsRouter from "./routes/tenants.js";
import "dotenv/config";
const app = express();
app.use(express.json());

// resolve __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// serve UI
app.use(express.static(path.join(__dirname, "ui")));

// routes
app.use("/tenants", tenantsRouter);

// local-only
app.listen(4001, "127.0.0.1", () => {
  console.log("Admin backend running at http://localhost:4001");
});
