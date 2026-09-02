import { describe, expect, it } from "vitest";
import {
  attendeeSchema,
  generateRegistrationId,
  safeDestinationUrl,
  validateCustomFields,
} from "@/lib/registration";
import type { EventFieldRow } from "@/lib/publicEvents";

describe("attendeeSchema", () => {
  it("accepts a normal, valid attendee", () => {
    const result = attendeeSchema.safeParse({
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ada@example.com",
      phone: "+2348010000000",
      org: "Analytical Engines Inc",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a missing first name", () => {
    const result = attendeeSchema.safeParse({
      firstName: "",
      lastName: "Lovelace",
      email: "ada@example.com",
      phone: "",
      org: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid email", () => {
    const result = attendeeSchema.safeParse({
      firstName: "Ada",
      lastName: "Lovelace",
      email: "not-an-email",
      phone: "",
      org: "",
    });
    expect(result.success).toBe(false);
  });

  it("allows optional phone and org to be omitted", () => {
    const result = attendeeSchema.safeParse({
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ada@example.com",
      phone: "",
      org: "",
    });
    expect(result.success).toBe(true);
  });

  it("accepts unicode/accented names rather than rejecting unusual characters", () => {
    const result = attendeeSchema.safeParse({
      firstName: "Chidinma",
      lastName: "Ọlá",
      email: "chi@example.com",
      phone: "",
      org: "",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a name far beyond any reasonable length", () => {
    const result = attendeeSchema.safeParse({
      firstName: "A".repeat(5000),
      lastName: "Lovelace",
      email: "ada@example.com",
      phone: "",
      org: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("generateRegistrationId", () => {
  it("produces a code in the expected EVT-XXXX-XXXX shape", () => {
    const id = generateRegistrationId();
    expect(id).toMatch(/^EVT-[A-Z0-9]+-[A-Z0-9]+$/);
  });

  it("is not trivially predictable across calls", () => {
    const ids = new Set(Array.from({ length: 20 }, () => generateRegistrationId()));
    expect(ids.size).toBe(20);
  });
});

describe("safeDestinationUrl", () => {
  it("passes through a normal https URL", () => {
    expect(safeDestinationUrl("https://zoom.us/j/123456")).toBe("https://zoom.us/j/123456");
  });

  it("passes through mailto: and tel: links", () => {
    expect(safeDestinationUrl("mailto:host@example.com")).toContain("mailto:");
    expect(safeDestinationUrl("tel:+2348010000000")).toContain("tel:");
  });

  it("rejects javascript: URLs", () => {
    expect(safeDestinationUrl("javascript:alert(1)")).toBeNull();
  });

  it("rejects data: URLs", () => {
    expect(safeDestinationUrl("data:text/html,<script>alert(1)</script>")).toBeNull();
  });

  it("rejects malformed URLs instead of throwing", () => {
    expect(safeDestinationUrl("not a url at all")).toBeNull();
  });

  it("returns null for empty/absent input", () => {
    expect(safeDestinationUrl(null)).toBeNull();
    expect(safeDestinationUrl(undefined)).toBeNull();
    expect(safeDestinationUrl("")).toBeNull();
  });
});

describe("validateCustomFields", () => {
  const field = (overrides: Partial<EventFieldRow>): EventFieldRow => ({
    id: "f1",
    event_id: "e1",
    form_id: null,
    field_type: "short_text",
    label: "Question",
    help_text: null,
    placeholder: null,
    is_required: false,
    options: null,
    sort_order: 0,
    created_at: new Date().toISOString(),
    ...overrides,
  });

  it("flags a missing required field", () => {
    const errors = validateCustomFields([field({ is_required: true })], {});
    expect(errors.f1).toBeDefined();
  });

  it("allows a missing optional field", () => {
    const errors = validateCustomFields([field({ is_required: false })], {});
    expect(errors.f1).toBeUndefined();
  });

  it("validates email-type custom fields", () => {
    const errors = validateCustomFields([field({ field_type: "email" })], { f1: "not-an-email" });
    expect(errors.f1).toBeDefined();
  });

  it("rejects an excessively long free-text answer", () => {
    const errors = validateCustomFields([field({ field_type: "short_text" })], {
      f1: "x".repeat(2001),
    });
    expect(errors.f1).toBeDefined();
  });

  it("accepts a reasonable free-text answer", () => {
    const errors = validateCustomFields([field({ field_type: "short_text" })], {
      f1: "A normal answer.",
    });
    expect(errors.f1).toBeUndefined();
  });
});
