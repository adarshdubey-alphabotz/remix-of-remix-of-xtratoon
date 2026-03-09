import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import streamRoutes from "./routes/stream";
import { getTelegramClient } from "./telegram";

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || "3001", 10);

// CORS
const allowedOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : "*",
    methods: ["GET", "HEAD", "OPTIONS"],
    allowedHeaders: ["Range", "Content-Type", "Authorization"],
    exposedHeaders: ["Content-Range", "Accept-Ranges", "Content-Length"],
  })
);

app.use(express.json());

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "xtratoon-stream", uptime: process.uptime() });
});

// API routes
app.use("/api", streamRoutes);

// Start server
async function start() {
  try {
    // Initialize Telegram MTProto client
    await getTelegramClient();
    console.log("✅ Telegram client ready");

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Xtratoon Stream Backend running on port ${PORT}`);
      console.log(`   Health: http://localhost:${PORT}/health`);
      console.log(`   Stream: http://localhost:${PORT}/api/stream?file_id=XXX`);
      console.log(`   Catalog: http://localhost:${PORT}/api/catalog`);
    });
  } catch (err) {
    console.error("❌ Failed to start:", err);
    process.exit(1);
  }
}

start();
