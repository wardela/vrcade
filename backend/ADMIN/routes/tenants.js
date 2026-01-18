import express from "express";
import { createTenant } from "../controllers/createTenant.js";

const router = express.Router();

router.post("/create", createTenant);

export default router;
