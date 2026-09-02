export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB — matches the storage bucket's file_size_limit
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

/** Client-side check for fast, friendly feedback. Not the real security
 * boundary — the storage bucket's own file_size_limit/allowed_mime_types
 * (set in the Phase 6 migration) enforce this server-side regardless of
 * what the client sends, since accept="image/*" and any client check are
 * both trivially bypassable. */
export function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return "Please choose a JPG, PNG, WEBP, or GIF image.";
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return "Image must be under 5MB.";
  }
  return null;
}
