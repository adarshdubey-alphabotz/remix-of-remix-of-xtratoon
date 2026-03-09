/**
 * Decode Telegram Bot API file_id into MTProto components.
 * Based on Pyrogram's file_id.py implementation.
 * 
 * Bot API file_id format:
 * 1. base64url encoded
 * 2. RLE encoded (0x00 0xNN → NN zero bytes)
 * 3. Binary structure:
 *    - file_type: int32 LE (bits 0-23 = type, bit 24 = web, bit 25 = has_file_ref)
 *    - dc_id: int32 LE
 *    - [file_reference if has_file_ref flag]
 *    - type-specific fields (media_id, access_hash for documents)
 * 4. Last 2 bytes: sub_version, version
 */

export interface DecodedFileId {
  fileType: number;
  dcId: number;
  fileReference: Buffer;
  mediaId: bigint;
  accessHash: bigint;
}

// File type constants (matching Telegram's internal types)
export const FILE_TYPES = {
  THUMBNAIL: 0,
  CHAT_PHOTO: 1,
  PHOTO: 2,
  VOICE: 3,
  VIDEO: 4,
  DOCUMENT: 5,
  ENCRYPTED: 6,
  TEMP: 7,
  STICKER: 8,
  AUDIO: 9,
  ANIMATION: 10,
  ENCRYPTED_THUMBNAIL: 11,
  WALLPAPER: 12,
  VIDEO_NOTE: 13,
  SECURE_RAW: 14,
  SECURE: 15,
  BACKGROUND: 16,
  DOCUMENT_AS_FILE: 17,
} as const;

function base64UrlDecode(str: string): Buffer {
  let b64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (b64.length % 4) b64 += "=";
  return Buffer.from(b64, "base64");
}

function rleDecode(data: Buffer): Buffer {
  const result: number[] = [];
  let i = 0;
  while (i < data.length) {
    if (data[i] === 0x00) {
      if (i + 1 < data.length) {
        const count = data[i + 1];
        for (let j = 0; j < count; j++) result.push(0x00);
        i += 2;
      } else {
        result.push(data[i]);
        i++;
      }
    } else {
      result.push(data[i]);
      i++;
    }
  }
  return Buffer.from(result);
}

function readInt32LE(buf: Buffer, offset: number): number {
  return buf.readInt32LE(offset);
}

function readInt64LE(buf: Buffer, offset: number): bigint {
  return buf.readBigInt64LE(offset);
}

export function decodeFileId(fileId: string): DecodedFileId {
  const raw = base64UrlDecode(fileId);
  const data = rleDecode(raw);

  // Version info is at the end
  const version = data[data.length - 1];
  const subVersion = version >= 4 ? data[data.length - 2] : 0;

  // Strip version bytes
  const versionBytes = version >= 4 ? 2 : 1;
  const payload = data.subarray(0, data.length - versionBytes);

  let offset = 0;

  // Read file_type (int32 LE)
  const rawFileType = readInt32LE(payload, offset);
  offset += 4;

  const fileType = rawFileType & 0xffffff; // Lower 24 bits
  const hasFileReference = Boolean((rawFileType >> 25) & 1);

  // Read dc_id (int32 LE)
  const dcId = readInt32LE(payload, offset);
  offset += 4;

  // Read file_reference if present
  let fileReference = Buffer.from([]);
  if (hasFileReference) {
    // Variable-length: first byte is length
    const refLen = payload[offset];
    offset += 1;
    if (refLen > 0 && offset + refLen <= payload.length) {
      fileReference = Buffer.from(payload.subarray(offset, offset + refLen));
      offset += refLen;
    }
  }

  // For photo types, there are extra fields (photo_id, volume_id, etc.)
  // For document types (5, 8, 10, 17), it's simpler:
  let mediaId = BigInt(0);
  let accessHash = BigInt(0);

  if (
    fileType === FILE_TYPES.DOCUMENT ||
    fileType === FILE_TYPES.STICKER ||
    fileType === FILE_TYPES.ANIMATION ||
    fileType === FILE_TYPES.DOCUMENT_AS_FILE ||
    fileType === FILE_TYPES.VOICE ||
    fileType === FILE_TYPES.VIDEO ||
    fileType === FILE_TYPES.AUDIO ||
    fileType === FILE_TYPES.VIDEO_NOTE
  ) {
    if (offset + 16 <= payload.length) {
      mediaId = readInt64LE(payload, offset);
      offset += 8;
      accessHash = readInt64LE(payload, offset);
      offset += 8;
    }
  } else if (fileType === FILE_TYPES.PHOTO) {
    // Photo: photo_id (8) + access_hash (8) + volume_id (8) + ...
    if (offset + 16 <= payload.length) {
      mediaId = readInt64LE(payload, offset);
      offset += 8;
      accessHash = readInt64LE(payload, offset);
      offset += 8;
    }
  }

  return {
    fileType,
    dcId,
    fileReference,
    mediaId,
    accessHash,
  };
}

export function isDocumentType(fileType: number): boolean {
  return [
    FILE_TYPES.DOCUMENT,
    FILE_TYPES.STICKER,
    FILE_TYPES.ANIMATION,
    FILE_TYPES.DOCUMENT_AS_FILE,
    FILE_TYPES.VOICE,
    FILE_TYPES.VIDEO,
    FILE_TYPES.AUDIO,
    FILE_TYPES.VIDEO_NOTE,
  ].includes(fileType as typeof FILE_TYPES[keyof typeof FILE_TYPES]);
}
