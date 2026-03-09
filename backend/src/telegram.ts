import { TelegramClient, Api } from "telegram";
import { StringSession } from "telegram/sessions";
import bigInt from "big-integer";
import { decodeFileId, isDocumentType, FILE_TYPES, type DecodedFileId } from "./fileIdDecoder";
import { LRUCache } from "./cache";

let client: TelegramClient | null = null;

// ─── Caches ─────────────────────────────────────────────────
// File metadata cache: file_id → decoded info + mime
const metaCache = new LRUCache<{
  decoded: DecodedFileId;
  mimeType: string;
  size: number;
}>(10000, 60 * 60 * 1000); // 10k entries, 1 hour TTL

// Full file cache: file_id → complete Buffer (for small files < 2MB)
const fileCache = new LRUCache<Buffer>(
  256 * 1024 * 1024, // 256MB max RAM for file cache
  30 * 60 * 1000, // 30 min TTL
  "bytes"
);

// Bot API file path cache
const pathCache = new LRUCache<{ path: string; size: number }>(
  5000,
  25 * 60 * 1000 // 25 min (Telegram paths expire ~30min)
);

const mimeMap: Record<string, string> = {
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png",
  gif: "image/gif", webp: "image/webp", bmp: "image/bmp",
  mp4: "video/mp4", mkv: "video/x-matroska", webm: "video/webm",
  svg: "image/svg+xml",
};

// ─── Client ─────────────────────────────────────────────────
export async function getTelegramClient(): Promise<TelegramClient> {
  if (client?.connected) return client;

  const apiId = parseInt(process.env.TELEGRAM_API_ID || "0", 10);
  const apiHash = process.env.TELEGRAM_API_HASH || "";
  const session = process.env.TELEGRAM_SESSION || "";

  if (!apiId || !apiHash) throw new Error("TELEGRAM_API_ID and TELEGRAM_API_HASH required");

  client = new TelegramClient(new StringSession(session), apiId, apiHash, {
    connectionRetries: 10,
    retryDelay: 1000,
    autoReconnect: true,
    useWSS: false,
  });

  await client.start({ botAuthToken: process.env.TELEGRAM_BOT_TOKEN || "" });
  console.log("✅ MTProto client connected (DC:", client.session.dcId, ")");
  return client;
}

// ─── File Info via Bot API (for mime/size detection) ────────
async function getBotApiFileInfo(fileId: string): Promise<{ path: string; size: number; mimeType: string }> {
  const cached = pathCache.get(fileId);
  if (cached) {
    const ext = cached.path.split(".").pop()?.toLowerCase() || "";
    return { ...cached, mimeType: mimeMap[ext] || "application/octet-stream" };
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN!;
  const res = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`);
  const data = await res.json();
  if (!data.ok) throw new Error(`getFile failed: ${data.description}`);

  const info = { path: data.result.file_path as string, size: (data.result.file_size || 0) as number };
  pathCache.set(fileId, info);

  const ext = info.path.split(".").pop()?.toLowerCase() || "";
  return { ...info, mimeType: mimeMap[ext] || "application/octet-stream" };
}

// ─── MTProto Download ───────────────────────────────────────
/**
 * Download entire file via MTProto into a Buffer.
 * Best for files < 5MB (manga pages).
 */
export async function downloadFile(fileId: string): Promise<{ buffer: Buffer; mimeType: string; size: number }> {
  // Check full file cache first
  const cachedFile = fileCache.get(fileId);
  const cachedMeta = metaCache.get(fileId);
  if (cachedFile && cachedMeta) {
    return { buffer: cachedFile, mimeType: cachedMeta.mimeType, size: cachedMeta.size };
  }

  const tc = await getTelegramClient();
  const decoded = decodeFileId(fileId);
  const { mimeType, size } = await getBotApiFileInfo(fileId);

  // Store metadata
  metaCache.set(fileId, { decoded, mimeType, size });

  let fileBuffer: Buffer;

  if (isDocumentType(decoded.fileType) && decoded.mediaId !== BigInt(0)) {
    // ─── True MTProto streaming via InputDocumentFileLocation ───
    try {
      const inputLocation = new Api.InputDocumentFileLocation({
        id: bigInt(decoded.mediaId.toString()),
        accessHash: bigInt(decoded.accessHash.toString()),
        fileReference: decoded.fileReference,
        thumbSize: "",
      });

      const chunks: Buffer[] = [];
      const chunkSize = 512 * 1024; // 512KB chunks for speed

      for await (const chunk of tc.iterDownload({
        file: inputLocation,
        requestSize: chunkSize,
        dcId: decoded.dcId,
      })) {
        chunks.push(Buffer.from(chunk));
      }

      fileBuffer = Buffer.concat(chunks);
      console.log(`⚡ MTProto download: ${fileId.slice(0, 20)}... (${fileBuffer.length} bytes)`);
    } catch (err) {
      console.warn("⚠️ MTProto failed, falling back to Bot API:", (err as Error).message);
      fileBuffer = await downloadViaBotApi(fileId);
    }
  } else {
    // Photo type or couldn't decode - use Bot API fallback
    fileBuffer = await downloadViaBotApi(fileId);
  }

  // Cache small files in RAM (< 2MB)
  if (fileBuffer.length < 2 * 1024 * 1024) {
    fileCache.set(fileId, fileBuffer, undefined, fileBuffer.length);
  }

  return { buffer: fileBuffer, mimeType, size: fileBuffer.length };
}

/**
 * Stream file via MTProto in chunks (for large files / range requests).
 */
export async function* streamFileChunks(
  fileId: string,
  offset: number = 0,
  limit?: number
): AsyncGenerator<Buffer> {
  const tc = await getTelegramClient();
  const decoded = decodeFileId(fileId);

  if (isDocumentType(decoded.fileType) && decoded.mediaId !== BigInt(0)) {
    try {
      const inputLocation = new Api.InputDocumentFileLocation({
        id: bigInt(decoded.mediaId.toString()),
        accessHash: bigInt(decoded.accessHash.toString()),
        fileReference: decoded.fileReference,
        thumbSize: "",
      });

      const chunkSize = 512 * 1024;
      let downloaded = 0;
      const maxBytes = limit || Infinity;

      for await (const chunk of tc.iterDownload({
        file: inputLocation,
        offset: bigInt(offset),
        requestSize: chunkSize,
        dcId: decoded.dcId,
      })) {
        const buf = Buffer.from(chunk);
        downloaded += buf.length;

        if (downloaded > maxBytes) {
          // Trim last chunk
          const excess = downloaded - maxBytes;
          yield buf.subarray(0, buf.length - excess);
          break;
        }

        yield buf;
      }
      return;
    } catch (err) {
      console.warn("⚠️ MTProto stream failed, falling back:", (err as Error).message);
    }
  }

  // Fallback: Bot API streaming
  yield await downloadViaBotApi(fileId, offset, limit);
}

// ─── Bot API Fallback ───────────────────────────────────────
async function downloadViaBotApi(fileId: string, offset?: number, limit?: number): Promise<Buffer> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN!;
  const { path } = await getBotApiFileInfo(fileId);
  const url = `https://api.telegram.org/file/bot${botToken}/${path}`;

  const headers: Record<string, string> = {};
  if (offset !== undefined && offset > 0) {
    const end = limit ? offset + limit - 1 : "";
    headers["Range"] = `bytes=${offset}-${end}`;
  }

  const res = await fetch(url, { headers });
  if (!res.ok && res.status !== 206) throw new Error(`Bot API fetch failed: ${res.status}`);

  return Buffer.from(await res.arrayBuffer());
}

// ─── Public helpers ─────────────────────────────────────────
export async function getFileInfo(fileId: string): Promise<{ mimeType: string; size: number }> {
  const cached = metaCache.get(fileId);
  if (cached) return { mimeType: cached.mimeType, size: cached.size };

  const info = await getBotApiFileInfo(fileId);
  return { mimeType: info.mimeType, size: info.size };
}

export function getCacheStats() {
  return {
    meta: metaCache.stats,
    files: fileCache.stats,
    paths: pathCache.stats,
  };
}
