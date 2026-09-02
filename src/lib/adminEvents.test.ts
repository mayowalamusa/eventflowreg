import { describe, expect, it } from "vitest";
import { computeStatus } from "@/lib/adminEvents";

const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
const past = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

describe("computeStatus", () => {
  it("is archived when archived_at is set, regardless of other fields", () => {
    const status = computeStatus({
      is_published: true,
      archived_at: new Date().toISOString(),
      event_date: future,
    });
    expect(status).toBe("archived");
  });

  it("is draft when unpublished and not archived", () => {
    const status = computeStatus({ is_published: false, archived_at: null, event_date: future });
    expect(status).toBe("draft");
  });

  it("is published for a future, published, non-archived event", () => {
    const status = computeStatus({ is_published: true, archived_at: null, event_date: future });
    expect(status).toBe("published");
  });

  it("is past for a published event whose date has already passed", () => {
    const status = computeStatus({ is_published: true, archived_at: null, event_date: past });
    expect(status).toBe("past");
  });

  it("archived takes priority over past", () => {
    const status = computeStatus({
      is_published: true,
      archived_at: new Date().toISOString(),
      event_date: past,
    });
    expect(status).toBe("archived");
  });
});
