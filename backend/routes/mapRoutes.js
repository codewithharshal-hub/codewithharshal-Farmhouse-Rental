import express from "express";
import { getMapFarmhouses } from "../controllers/mapController.js";

const router = express.Router();

router.get("/farmhouses", getMapFarmhouses);

export default router;