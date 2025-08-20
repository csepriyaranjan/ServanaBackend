// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: "gmail", // or use host/port if custom SMTP
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Contact API
app.post("/api/contact", async (req, res) => {
  const { firstName, lastName, email, phone, message } = req.body;

  if (!email || !message) {
    return res.status(400).json({ success: false, error: "Missing fields" });
  }

  try {
    await transporter.sendMail({
      from: `"${firstName} ${lastName}" <${email}>`,
      to: process.env.RECEIVER_EMAIL,
      subject: "New Contact Form Submission",
      html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2 style="color: #2d89ef;">New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${firstName} ${lastName}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Phone:</strong> ${phone || "N/A"}</p>
          <p><strong>Message:</strong></p>
          <p style="background:#f9f9f9;padding:10px;border-radius:6px;">${message}</p>
          <br/>
          <small style="color:#888;">Sent via Website Contact Form</small>
        </div>
      `,
    });

    res.json({ success: true, message: "Message sent successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Failed to send email" });
  }
});

// Start Project API
app.post("/api/startproject", async (req, res) => {
  const { name, email, contact, projectName, projectType, description } = req.body;

  if (!name || !contact || !projectName) {
    return res.status(400).json({ success: false, error: "Missing fields" });
  }

  try {
    await transporter.sendMail({
      from: `"${name}" <${contact}>`,
      to: process.env.RECEIVER_EMAIL,
      subject: "New Project Request",
      html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2 style="color:#28a745;">New Project Request</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email || "N/A"}</p>
          <p><strong>Contact:</strong> ${contact}</p>
          <p><strong>Project Name:</strong> ${projectName}</p>
          <p><strong>Project Type:</strong> ${projectType || "N/A"}</p>
          <p><strong>Description:</strong></p>
          <p style="background:#f9f9f9;padding:10px;border-radius:6px;">${description || "No details provided"}</p>
          <br/>
          <small style="color:#888;">Sent via Start Project Form</small>
        </div>
      `,
    });

    res.json({ success: true, message: "Project request sent successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Failed to send project request" });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(` Server running on http://localhost:${PORT}`);
});
