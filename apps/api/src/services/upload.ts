import { put } from "@vercel/blob";
import { HTTPException } from "hono/http-exception";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_PROFILE_PICTURE_SIZE = 5 * 1024 * 1024; // 5MB for profile pictures
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"];
const ALLOWED_MIME_EXTENSIONS: Record<string, string> = {
  png: "png",
  jpeg: "jpg",
  gif: "gif",
  webp: "webp",
};

export async function uploadScreenshot(
  file: File,
  userId: string
): Promise<{ url: string }> {
  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    throw new HTTPException(413, { message: "File size exceeds 10MB limit" });
  }

  // Validate file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new HTTPException(400, {
      message: "Invalid file type. Only PNG, JPEG, GIF, and WebP are allowed",
    });
  }

  // Generate unique filename
  const timestamp = Date.now();
  const extension = file.name.split(".").pop() || "png";
  const filename = `screenshots/${userId}/${timestamp}.${extension}`;

  try {
    const blob = await put(filename, file, {
      access: "public",
      addRandomSuffix: true,
    });

    return { url: blob.url };
  } catch (error) {
    console.error("Upload error:", error);
    throw new HTTPException(500, { message: "Failed to upload file" });
  }
}

/**
 * Upload a base64-encoded screenshot to Vercel Blob
 * Accepts data URLs in format: data:image/png;base64,...
 */
export async function uploadBase64Screenshot(
  base64Data: string,
  userId: string
): Promise<{ url: string }> {
  // Validate and parse data URL format
  const matches = base64Data.match(
    /^data:image\/(png|jpeg|gif|webp);base64,(.+)$/
  );
  if (!matches) {
    throw new HTTPException(400, {
      message:
        "Invalid base64 image format. Expected data:image/(png|jpeg|gif|webp);base64,...",
    });
  }

  const [, mimeType, base64Content] = matches;

  // Decode base64 to buffer
  let buffer: Buffer;
  try {
    buffer = Buffer.from(base64Content, "base64");
  } catch {
    throw new HTTPException(400, { message: "Invalid base64 encoding" });
  }

  // Validate file size (10MB limit)
  if (buffer.length > MAX_FILE_SIZE) {
    throw new HTTPException(413, { message: "File size exceeds 10MB limit" });
  }

  // Generate unique filename
  const timestamp = Date.now();
  const extension = ALLOWED_MIME_EXTENSIONS[mimeType] || "png";
  const filename = `screenshots/${userId}/${timestamp}.${extension}`;

  try {
    const blob = await put(filename, buffer, {
      access: "public",
      addRandomSuffix: true,
      contentType: `image/${mimeType}`,
    });

    return { url: blob.url };
  } catch (error) {
    console.error("Upload error:", error);
    throw new HTTPException(500, { message: "Failed to upload file" });
  }
}

/**
 * Upload a profile picture to Vercel Blob
 */
export async function uploadProfilePicture(
  file: File,
  userId: string
): Promise<{ url: string }> {
  // Validate file size (5MB limit for profile pictures)
  if (file.size > MAX_PROFILE_PICTURE_SIZE) {
    throw new HTTPException(413, { message: "File size exceeds 5MB limit" });
  }

  // Validate file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new HTTPException(400, {
      message: "Invalid file type. Only PNG, JPEG, GIF, and WebP are allowed",
    });
  }

  // Generate unique filename
  const timestamp = Date.now();
  const extension = file.name.split(".").pop() || "png";
  const filename = `profile-pictures/${userId}/${timestamp}.${extension}`;

  try {
    const blob = await put(filename, file, {
      access: "public",
      addRandomSuffix: true,
    });

    return { url: blob.url };
  } catch (error) {
    console.error("Profile picture upload error:", error);
    throw new HTTPException(500, {
      message: "Failed to upload profile picture",
    });
  }
}
