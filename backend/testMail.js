import "dotenv/config";
import nodemailer from "nodemailer";

const user = process.env.SMTP_USER || "";
const pass = process.env.SMTP_PASS || "";
const port = Number(process.env.SMTP_PORT) || 465;

console.log("SMTP_HOST:", process.env.SMTP_HOST);
console.log("SMTP_PORT:", port);
console.log("SMTP_USER:", user);
console.log("SMTP_PASS length:", pass.length, "(App Password = 16)");
console.log("SMTP_PASS has spaces or quotes:", /[\s"']/.test(pass));

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user, pass },
});

try {
    await transporter.verify();
    console.log("SMTP OK: login worked");
} catch (err) {
    console.log("SMTP FAILED:", err.message);
}