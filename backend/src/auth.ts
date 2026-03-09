/**
 * One-time auth script to generate a Telegram session string.
 * Run: npm run auth
 * Then paste the session string into .env as TELEGRAM_SESSION
 */
import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import dotenv from "dotenv";
// @ts-ignore - input module lacks type declarations
import input from "input";

dotenv.config();

async function main() {
  const apiId = parseInt(process.env.TELEGRAM_API_ID || "0", 10);
  const apiHash = process.env.TELEGRAM_API_HASH || "";

  if (!apiId || !apiHash) {
    console.error("❌ Set TELEGRAM_API_ID and TELEGRAM_API_HASH in .env first");
    process.exit(1);
  }

  console.log("🔐 Authenticating with Telegram...");
  console.log("   This will use your BOT TOKEN (no phone number needed)\n");

  const client = new TelegramClient(new StringSession(""), apiId, apiHash, {
    connectionRetries: 5,
  });

  await client.start({
    botAuthToken: process.env.TELEGRAM_BOT_TOKEN || "",
  });

  const session = client.session.save() as unknown as string;
  console.log("\n✅ Authentication successful!");
  console.log("\n📋 Add this to your .env file:\n");
  console.log(`TELEGRAM_SESSION=${session}`);
  console.log("\n");

  await client.disconnect();
  process.exit(0);
}

main().catch(console.error);
