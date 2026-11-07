import express from "express";
import {
    addFavorite,
    getFavoriteIds,
    getFavorites,
    removeFavorite,
} from "../controllers/favoriteController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/ids", getFavoriteIds);
router.get("/", getFavorites);
router.post("/:farmhouseId", addFavorite);
router.delete("/:farmhouseId", removeFavorite);

export default router;