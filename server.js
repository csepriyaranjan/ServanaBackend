// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { google } from "googleapis";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "10kb" }));

// Rate limiter
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // max 30 requests per IP
  message: { success: false, error: "Too many requests, try again later." },
});
app.use("/api/", limiter);

// OAuth2 client for Gmail API
const oAuth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  process.env.GMAIL_REDIRECT_URI
);
oAuth2Client.setCredentials({
  refresh_token: process.env.GMAIL_REFRESH_TOKEN,
});

// Helper: Base64url encode email
function base64urlEncode(str) {
  return Buffer.from(str)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// Escape HTML to prevent injection
function escapeHtml(str) {
  if (typeof str !== "string") return str;
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Build raw email
function buildRawEmail({ fromName, toEmail, subject, htmlBody, replyTo }) {
  const fromHeader = `"${fromName || "Website Visitor"}" <${process.env.EMAIL_USER}>`;
  const replyHeader = replyTo ? `Reply-To: ${replyTo}\r\n` : "";
  const message =
    `From: ${fromHeader}\r\n` +
    `To: ${toEmail}\r\n` +
    `${replyHeader}` +
    `Subject: ${subject}\r\n` +
    `MIME-Version: 1.0\r\n` +
    `Content-Type: text/html; charset="UTF-8"\r\n\r\n` +
    htmlBody;
  return base64urlEncode(message);
}

// Send email via Gmail API
async function sendMail({ raw }) {
  const gmail = google.gmail({ version: "v1", auth: oAuth2Client });
  const res = await gmail.users.messages.send({ userId: "me", requestBody: { raw } });
  return res.data;
}

// Payload validation
function validateContact(body) {
  const { email, message } = body;
  if (!email || typeof email !== "string") return "Invalid or missing email";
  if (!message || typeof message !== "string") return "Invalid or missing message";
  return null;
}

function validateProject(body) {
  const { name, contact, projectName } = body;
  if (!name || typeof name !== "string") return "Invalid or missing name";
  if (!contact || typeof contact !== "string") return "Invalid or missing contact";
  if (!projectName || typeof projectName !== "string") return "Invalid or missing projectName";
  return null;
}

// Contact form endpoint
app.post("/api/contact", async (req, res) => {
  try {
    const error = validateContact(req.body);
    if (error) return res.status(400).json({ success: false, error });

    const { firstName = "", lastName = "", email, phone = "N/A", message } = req.body;

    const html = `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2 style="color:#2d89ef;">New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${escapeHtml(firstName)} ${escapeHtml(lastName)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Phone:</strong> ${escapeHtml(phone)}</p>
        <p><strong>Message:</strong></p>
        <div style="background:#f9f9f9;padding:10px;border-radius:6px;">${escapeHtml(message)}</div>
        <br/><small style="color:#888;">Sent via Website Contact Form</small>
      </div>
    `;

    const raw = buildRawEmail({
      fromName: `${firstName} ${lastName}`.trim() || "Website Visitor",
      toEmail: process.env.RECEIVER_EMAIL,
      subject: "New Contact Form Submission",
      htmlBody: html,
      replyTo: email,
    });

    const data = await sendMail({ raw });
    res.json({ success: true, message: "Message sent successfully!", id: data.id });
  } catch (err) {
    console.error("Contact send error:", err);
    res.status(500).json({ success: false, error: "Failed to send email" });
  }
});

// Start project endpoint
app.post("/api/startproject", async (req, res) => {
  try {
    const error = validateProject(req.body);
    if (error) return res.status(400).json({ success: false, error });

    const { name, email = "N/A", contact, projectName, projectType = "N/A", description = "No details provided" } =
      req.body;

    const html = `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2 style="color:#28a745;">New Project Request</h2>
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Contact:</strong> ${escapeHtml(contact)}</p>
        <p><strong>Project Name:</strong> ${escapeHtml(projectName)}</p>
        <p><strong>Project Type:</strong> ${escapeHtml(projectType)}</p>
        <p><strong>Description:</strong></p>
        <div style="background:#f9f9f9;padding:10px;border-radius:6px;">${escapeHtml(description)}</div>
        <br/><small style="color:#888;">Sent via Start Project Form</small>
      </div>
    `;

    const raw = buildRawEmail({
      fromName: name,
      toEmail: process.env.RECEIVER_EMAIL,
      subject: "New Project Request",
      htmlBody: html,
      replyTo: email || contact,
    });

    const data = await sendMail({ raw });
    res.json({ success: true, message: "Project request sent successfully!", id: data.id });
  } catch (err) {
    console.error("Project send error:", err);
    res.status(500).json({ success: false, error: "Failed to send project request" });
  }
});

// Health check
app.get("/api/health", (req, res) => res.json({ ok: true }));

// Start server
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
