import express from "express";
import {
    getAllFarmhouses,
    getAllUsers,
    getDashboardStats,
    setUserBlocked,
    updateFarmhouseStatus,
} from "../controllers/adminController.js";
import {
    adminReply,
    getAllTickets,
    getTicketForAdmin,
    setTicketStatus,
} from "../controllers/supportController.js";
import { adminOnly } from "../middleware/adminMiddleware.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect, adminOnly);

router.get("/dashboard", getDashboardStats);
router.get("/users", getAllUsers);
router.put("/users/:id/block", setUserBlocked);
router.get("/farmhouses", getAllFarmhouses);
router.put("/farmhouses/:id/status", updateFarmhouseStatus);

router.get("/support", getAllTickets);
router.get("/support/:id", getTicketForAdmin);
router.post("/support/:id/reply", adminReply);
router.put("/support/:id/status", setTicketStatus);

export default router;