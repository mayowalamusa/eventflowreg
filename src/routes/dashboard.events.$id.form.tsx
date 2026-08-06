import { createFileRoute } from "@tanstack/react-router";
import FormBuilder from "@/components/events/FormBuilder";

export const Route = createFileRoute("/dashboard/events/$id/form")({
  head: () => ({
    meta: [
      { title: "Registration form builder — EventFlow" },
      {
        name: "description",
        content: "Add, edit, reorder and delete custom registration fields for your event.",
      },
      { property: "og:title", content: "Registration form builder — EventFlow" },
      {
        property: "og:description",
        content: "Add, edit, reorder and delete custom registration fields for your event.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FormBuilderRoute,
});

function FormBuilderRoute() {
  const { id } = Route.useParams();
  return <FormBuilder eventId={id} />;
}
