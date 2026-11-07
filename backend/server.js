import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import seedAdmin from "./config/seedAdmin.js";
import authRoutes from "./routes/authRoutes.js";
import farmhouseRoutes from "./routes/farmhouseRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import supportRoutes from "./routes/supportRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import favoriteRoutes from "./routes/favoriteRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import assistantRoutes from "./routes/assistantRoutes.js";
import mapRoutes from "./routes/mapRoutes.js";

connectDB();
seedAdmin();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

app.use(cors());
app.use(express.json());

// upload ki hui photos yahan se milti hain
app.use(
    "/uploads",
    express.static(path.join(__dirname, "uploads"), {
        maxAge: "7d",
        immutable: true,
        setHeaders: (res) => {
            res.setHeader("X-Content-Type-Options", "nosniff");
        },
    })
);

app.use("/api/auth", authRoutes);
app.use("/api/farmhouses", farmhouseRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/assistant", assistantRoutes);
app.use("/api/map", mapRoutes);

app.get("/", (req, res) => {
    res.send("Farmhouse Rental API is running");
});

// unknown route
app.use((req, res) => {
    res.status(404).json({ message: "Route not found" });
});

// error handler (Express 5 async errors yahin aate hain)
app.use((err, req, res, next) => {
    console.error(err);
    const status = err.statusCode || err.status || 500;
    res.status(status).json({
        message: status < 500 ? err.message : "Something went wrong on the server",
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});