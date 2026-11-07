import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const UPLOAD_DIR = path.join(__dirname, "..", "uploads");

const MAX_FILES = 5;
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_SIZE, files: MAX_FILES },
    fileFilter: (req, file, cb) => {
        if (["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Only JPG, PNG or WEBP photos are allowed"));
        }
    },
});

// multer ke errors ko saaf message mein badalta hai
export const uploadMiddleware = (req, res, next) => {
    upload.array("images", MAX_FILES)(req, res, (err) => {
        if (!err) return next();

        const messages = {
            LIMIT_FILE_SIZE: "Each photo must be 5 MB or smaller",
            LIMIT_FILE_COUNT: `You can upload up to ${MAX_FILES} photos`,
            LIMIT_UNEXPECTED_FILE: `You can upload up to ${MAX_FILES} photos`,
        };

        return res.status(400).json({
            message: messages[err.code] || err.message || "Upload failed",
        });
    });
};

// file ka naam nahi, uske andar ke bytes dekh ke asli type pehchanta hai
const detectExtension = (buf) => {
    if (buf.length < 12) return null;

    if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg";

    if (
        buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47 &&
        buf[4] === 0x0d && buf[5] === 0x0a && buf[6] === 0x1a && buf[7] === 0x0a
    ) {
        return "png";
    }

    if (
        buf.toString("ascii", 0, 4) === "RIFF" &&
        buf.toString("ascii", 8, 12) === "WEBP"
    ) {
        return "webp";
    }

    return null;
};

export const uploadPhotos = async (req, res) => {
    try {
        const files = req.files || [];

        if (files.length === 0) {
            return res.status(400).json({
                message: "Please choose at least one photo",
            });
        }

        const checked = files.map((f) => ({
            buffer: f.buffer,
            ext: detectExtension(f.buffer),
        }));

        if (checked.some((c) => !c.ext)) {
            return res.status(400).json({
                message: "One of the files is not a valid JPG, PNG or WEBP image",
            });
        }

        await fs.mkdir(UPLOAD_DIR, { recursive: true });

        const base = (process.env.BASE_URL || `${req.protocol}://${req.get("host")}`).replace(/\/$/, "");
        const urls = [];

        for (const c of checked) {
            const name = `${crypto.randomUUID()}.${c.ext}`;
            await fs.writeFile(path.join(UPLOAD_DIR, name), c.buffer);
            urls.push(`${base}/uploads/${name}`);
        }

        res.status(201).json({ urls });
    } catch (error) {
        console.error("Upload error:", error.message);
        res.status(500).json({
            message: "Could not upload photos",
        });
    }
};