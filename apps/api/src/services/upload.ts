import { put } from "@vercel/blob";
import { HTTPException } from "hono/http-exception";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"];

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
