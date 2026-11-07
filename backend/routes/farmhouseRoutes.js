import express from "express";
import {
    createFarmhouse,
    deleteFarmhouse,
    getFarmhouseById,
    getFarmhouses,
    getMyFarmhouses,
    updateFarmhouse,
    updateFarmhouseUpi,
} from "../controllers/farmhouseController.js";
import { protect } from "../middleware/authMiddleware.js";
import { hostOnly } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get("/", getFarmhouses);
router.get("/my", protect, hostOnly, getMyFarmhouses); // /:id se pehle
router.get("/:id", getFarmhouseById);
router.post("/", protect, hostOnly, createFarmhouse);
router.put("/:id/upi", protect, updateFarmhouseUpi);
router.put("/:id", protect, hostOnly, updateFarmhouse);
router.delete("/:id", protect, hostOnly, deleteFarmhouse);

export default router;