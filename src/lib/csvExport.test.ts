import { describe, expect, it } from "vitest";
import { csvCell, registrationsToCsv } from "@/lib/csvExport";

describe("csvCell", () => {
  it("leaves plain values untouched", () => {
    expect(csvCell("Ada Lovelace")).toBe("Ada Lovelace");
  });

  it("quotes a value containing a comma", () => {
    expect(csvCell("Lagos, Nigeria")).toBe('"Lagos, Nigeria"');
  });

  it("quotes and escapes a value containing double quotes", () => {
    expect(csvCell('She said "hi"')).toBe('"She said ""hi"""');
  });

  it("quotes a value containing a newline", () => {
    expect(csvCell("Line one\nLine two")).toBe('"Line one\nLine two"');
  });
});

describe("registrationsToCsv", () => {
  it("produces a header row plus one row per registration", () => {
    const csv = registrationsToCsv([
      {
        full_name: "Ada Lovelace",
        email: "ada@example.com",
        phone: "+2348010000000",
        ticket_code: "EVT-AB12-CD34",
        status: "confirmed",
        created_at: "2026-08-20T10:00:00.000Z",
        amount_paid_cents: 0,
        eventTitle: "Launch Party",
      },
    ]);
    const lines = csv.split("\r\n");
    expect(lines[0]).toBe(
      "Name,Email,Phone,Event,Registration Code,Status,Amount Paid (cents),Registered At",
    );
    expect(lines[1]).toContain("Ada Lovelace");
    expect(lines[1]).toContain("Launch Party");
    expect(lines).toHaveLength(2);
  });

  it("escapes a comma in the event title so the row still has the right column count", () => {
    const csv = registrationsToCsv([
      {
        full_name: "Ada Lovelace",
        email: "ada@example.com",
        phone: null,
        ticket_code: null,
        status: "confirmed",
        created_at: "2026-08-20T10:00:00.000Z",
        amount_paid_cents: 0,
        eventTitle: "Launch, Party & Mixer",
      },
    ]);
    const dataRow = csv.split("\r\n")[1];
    expect(dataRow).toContain('"Launch, Party & Mixer"');
  });

  it("returns just the header for an empty registration list", () => {
    const csv = registrationsToCsv([]);
    expect(csv.split("\r\n")).toHaveLength(1);
  });
});
