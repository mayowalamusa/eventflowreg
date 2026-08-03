import { createFileRoute } from "@tanstack/react-router";
import EventEditor from "@/components/events/EventEditor";

export const Route = createFileRoute("/dashboard/events/new")({
  head: () => ({
    meta: [
      { title: "Create an event — EventFlow" },
      {
        name: "description",
        content: "Build a new event registration page with custom fields and a join destination.",
      },
      { property: "og:title", content: "Create an event — EventFlow" },
      {
        property: "og:description",
        content: "Build a new event registration page with custom fields and a join destination.",
      },
    ],
  }),
  component: EventEditor,
});
