import { createFileRoute } from "@tanstack/react-router";
import EventEditor from "@/components/events/EventEditor";

export const Route = createFileRoute("/dashboard/events/$id/edit")({
  head: () => ({
    meta: [
      { title: "Edit event — EventFlow" },
      { name: "description", content: "Update your event details, schedule, visibility and redirect destination." },
      { property: "og:title", content: "Edit event — EventFlow" },
      {
        property: "og:description",
        content: "Update your event details, schedule, visibility and redirect destination.",
      },
    ],
  }),
  component: EditEventRoute,
});

function EditEventRoute() {
  const { id } = Route.useParams();
  return <EventEditor eventId={id} />;
}
