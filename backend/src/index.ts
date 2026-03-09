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
    methods: ["GET", "HEAD", "OPTIONS", "POST"],
    allowedHeaders: ["Range", "Content-Type", "Authorization"],
    exposedHeaders: ["Content-Range", "Accept-Ranges", "Content-Length", "X-Stream-Source"],
  })
);

app.use(express.json());

// Health check
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "komixora-mtproto-stream",
    uptime: Math.floor(process.uptime()),
    memory: {
      rss: Math.floor(process.memoryUsage().rss / 1024 / 1024) + "MB",
      heap: Math.floor(process.memoryUsage().heapUsed / 1024 / 1024) + "MB",
    },
  });
});

// API routes
app.use("/api", streamRoutes);

// Start
async function start() {
  try {
    await getTelegramClient();

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`\n🚀 Komixora MTProto Stream Backend`);
      console.log(`   Port: ${PORT}`);
      console.log(`   Health: http://localhost:${PORT}/health`);
      console.log(`   Stream: http://localhost:${PORT}/api/stream?file_id=XXX`);
      console.log(`   Cache:  http://localhost:${PORT}/api/cache-stats\n`);
    });
  } catch (err) {
    console.error("❌ Failed to start:", err);
    process.exit(1);
  }
}

start();
