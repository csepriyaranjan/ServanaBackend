import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Resend } from "resend";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: ["https://servanalabs.vercel.app", "http://localhost:5173"],
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const resend = new Resend(process.env.RESEND_API_KEY);

const emailWrapper = (content) => `
  <div style="max-width:600px;margin:auto;background:#ffffff;padding:25px;border-radius:12px;
  font-family:Arial,Helvetica,sans-serif;border:1px solid #e5e5e5;color:#222;">
    <div style="text-align:center;margin-bottom:20px;">
      <div style="font-size:26px;font-weight:700;color:#2b2b2b;">Servana Labs</div>
      <div style="font-size:14px;color:#777;">New Submission Received</div>
      <hr style="margin-top:15px;border:none;border-top:1px solid #eee;">
    </div>
    ${content}
    <hr style="margin-top:25px;border:none;border-top:1px solid #eee;">
    <p style="text-align:center;font-size:12px;color:#888;margin-top:15px;">
      © Servana Labs • This is an automated notification
    </p>
  </div>
`;

app.post("/api/contact", async (req, res) => {
  const { firstName, lastName, email, phone, message } = req.body;

  if (!email || !message) return res.status(400).json({ success: false });

  const content = `
    <h2 style="color:#1d72b8;margin-bottom:10px;">New Contact Form Submission</h2>
    <p><strong>Name:</strong> ${firstName} ${lastName}</p>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Phone:</strong> ${phone || "N/A"}</p>
    <p style="margin-top:20px;"><strong>Message:</strong></p>
    <div style="background:#f7f7f7;padding:15px;border-radius:8px;font-size:14px;line-height:22px;">
      ${message}
    </div>
  `;

  try {
    await resend.emails.send({
      from: "Servana Labs <onboarding@resend.dev>",
      to: process.env.RECEIVER_EMAIL,
      subject: "New Contact Form Submission",
      html: emailWrapper(content),
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

app.post("/api/startproject", async (req, res) => {
  const { name, email, contact, projectName, projectType, description } = req.body;

  if (!name || !contact || !projectName)
    return res.status(400).json({ success: false });

  const content = `
    <h2 style="color:#28a745;margin-bottom:10px;">New Project Request</h2>
    <p><strong>Name:</strong> ${name}</p>
    <p><strong>Email:</strong> ${email || "N/A"}</p>
    <p><strong>Contact:</strong> ${contact}</p>
    <p><strong>Project Name:</strong> ${projectName}</p>
    <p><strong>Project Type:</strong> ${projectType || "N/A"}</p>

    <p style="margin-top:20px;"><strong>Description:</strong></p>
    <div style="background:#f7f7f7;padding:15px;border-radius:8px;font-size:14px;line-height:22px;">
      ${description || "No description provided"}
    </div>
  `;

  try {
    await resend.emails.send({
      from: "Servana Labs <onboarding@resend.dev>",
      to: process.env.RECEIVER_EMAIL,
      subject: "New Project Request",
      html: emailWrapper(content),
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

app.get("/", (req, res) => {
  res.send("Servana Backend Running");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
