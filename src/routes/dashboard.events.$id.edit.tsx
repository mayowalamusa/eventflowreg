import { createFileRoute } from "@tanstack/react-router";
import EventEditor from "@/components/events/EventEditor";

export const Route = createFileRoute("/dashboard/events/$id/edit")({
  head: () => ({
    meta: [
      { title: "Edit event — EventFlow" },
      { name: "description", content: "Update your event details, form fields and destination." },
      { property: "og:title", content: "Edit event — EventFlow" },
      {
        property: "og:description",
        content: "Update your event details, form fields and destination.",
      },
    ],
  }),
  component: EventEditor,
});
