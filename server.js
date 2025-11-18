import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Resend } from "resend";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: [
      "https://servanalabs.vercel.app",
      "http://localhost:5173"
    ],
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const resend = new Resend(process.env.RESEND_API_KEY);

app.post("/api/contact", async (req, res) => {
  const { firstName, lastName, email, phone, message } = req.body;

  if (!email || !message)
    return res.status(400).json({ success: false });

  try {
    await resend.emails.send({
      from: "Servana Labs <onboarding@resend.dev>",
      to: process.env.RECEIVER_EMAIL,
      subject: "New Contact Form Submission",
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${firstName} ${lastName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || "N/A"}</p>
        <p>${message}</p>
      `,
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

  try {
    await resend.emails.send({
      from: "Servana Labs <onboarding@resend.dev>",
      to: process.env.RECEIVER_EMAIL,
      subject: "New Project Request",
      html: `
        <h2>New Project Request</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email || "N/A"}</p>
        <p><strong>Contact:</strong> ${contact}</p>
        <p><strong>Project Name:</strong> ${projectName}</p>
        <p><strong>Project Type:</strong> ${projectType || "N/A"}</p>
        <p>${description || ""}</p>
      `,
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
