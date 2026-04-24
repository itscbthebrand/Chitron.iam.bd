import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import crypto from "crypto";
import { authenticator } from "otplib";

dotenv.config();

const app = express();
app.use(express.json());
const PORT = 3000;

// Since we can't easily use Firebase Admin here without a service account, 
// we will use simple in-memory storage for codes for this demonstration 
// or simulate it. In a real production app, use Firestore for this.
let activeAdminCode: string | null = null;
let mfaSecret: string | null = null; // In production, store this in Firestore
let mfaEnabled = false;

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_ID = process.env.TELEGRAM_ADMIN_ID;

// Helper to generate 12-char alphanumeric code
function generateAdminCode() {
  return crypto.randomBytes(6).toString('hex').toUpperCase();
}

// RESTORING Gemini/API routes that were deleted in previous turns if any
// (Actually just adding the new ones)

app.post("/api/admin/request-code", async (req, res) => {
  try {
    const code = generateAdminCode();
    activeAdminCode = code;
    
    await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      chat_id: ADMIN_ID,
      text: `🔐 ADMIN LOGIN REQUEST\n\nYour 12-digit access code is:\n\n${code}\n\nThis code is valid for this session only.`,
    });
    
    res.json({ success: true, message: "Code sent to Telegram" });
  } catch (error) {
    console.error("Auth error:", error);
    res.status(500).json({ error: "Failed to send code" });
  }
});

app.post("/api/admin/verify", async (req, res) => {
  const { code, type } = req.body;

  if (type === "telegram") {
    if (activeAdminCode && code === activeAdminCode) {
      activeAdminCode = null; // Clear after use
      return res.json({ success: true, token: "admin_verified_session" });
    }
  } else if (type === "mfa" && mfaEnabled && mfaSecret) {
    const isValid = authenticator.check(code, mfaSecret);
    if (isValid) {
      return res.json({ success: true, token: "admin_verified_session" });
    }
  }

  res.status(401).json({ error: "Invalid or expired code" });
});

app.post("/api/admin/mfa-setup", (req, res) => {
  const secret = authenticator.generateSecret();
  const otpauth = authenticator.keyuri("Chitron", "SocialPortfolio", secret);
  mfaSecret = secret; // WARNING: In-memory only for this example
  res.json({ secret, otpauth });
});

app.post("/api/admin/mfa-enable", (req, res) => {
  const { code } = req.body;
  if (mfaSecret && authenticator.check(code, mfaSecret)) {
    mfaEnabled = true;
    return res.json({ success: true });
  }
  res.status(400).json({ error: "Invalid verification code" });
});

app.get("/api/admin/mfa-status", (req, res) => {
  res.json({ enabled: mfaEnabled });
});

// Telegram Webhook / Messaging
app.post("/api/telegram-webhook", async (req, res) => {
  const { message, callback_query } = req.body;

  if (message) {
    const chatId = message.chat.id;
    const text = message.text;

    // Handle replies from Admin to Visitor
    if (chatId.toString() === ADMIN_ID && message.reply_to_message) {
      console.log("Admin replied to visitor");
    }

    // Handle /post and /story commands from Admin
    if (chatId.toString() === ADMIN_ID) {
      if (text?.startsWith("/post ")) {
        await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
          chat_id: ADMIN_ID,
          text: "Post functionality coming soon via Firebase integration!",
        });
      }
    }
  }

  res.sendStatus(200);
});

// Telegram Send Route (Web -> Admin)
app.post("/api/send-to-admin", async (req, res) => {
  try {
    const { name, message, sessionId } = req.body;
    const text = `📬 New Message from ${name} (Web)\n\nMessage: ${message}\n\nSession: ${sessionId}`;
    
    await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      chat_id: ADMIN_ID,
      text: text,
      reply_markup: {
        inline_keyboard: [
          [{ text: "Reply", callback_data: `reply_${sessionId}` }]
        ]
      }
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error("Telegram error:", error);
    res.status(500).json({ error: "Failed to notify admin" });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
