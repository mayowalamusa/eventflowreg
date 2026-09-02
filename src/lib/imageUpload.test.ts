import { describe, expect, it } from "vitest";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES, validateImageFile } from "@/lib/imageUpload";

function makeFile(type: string, sizeBytes: number): File {
  const blob = new Blob([new Uint8Array(sizeBytes)], { type });
  return new File([blob], "test-file", { type });
}

describe("validateImageFile", () => {
  it("accepts a small JPEG", () => {
    expect(validateImageFile(makeFile("image/jpeg", 1024))).toBeNull();
  });

  it("accepts every explicitly allowed type", () => {
    for (const type of ALLOWED_IMAGE_TYPES) {
      expect(validateImageFile(makeFile(type, 1024))).toBeNull();
    }
  });

  it("rejects a non-image file regardless of extension tricks", () => {
    expect(validateImageFile(makeFile("text/html", 1024))).not.toBeNull();
  });

  it("rejects a file over the size limit", () => {
    expect(validateImageFile(makeFile("image/png", MAX_IMAGE_BYTES + 1))).not.toBeNull();
  });

  it("accepts a file right at the size limit", () => {
    expect(validateImageFile(makeFile("image/png", MAX_IMAGE_BYTES))).toBeNull();
  });
});
