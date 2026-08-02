import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/events")({
  head: () => ({
    meta: [
      { title: "Events — EventFlow" },
      { name: "description", content: "Create and manage your EventFlow event pages." },
      { property: "og:title", content: "Events — EventFlow" },
      { property: "og:description", content: "Create and manage your EventFlow event pages." },
    ],
  }),
  component: EventsPage,
});

function EventsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Events</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Event creation and management arrives in the next step.
        </p>
      </div>
      <Card className="shadow-soft">
        <CardContent className="p-10 text-center text-sm text-muted-foreground">
          Coming next: the event builder with banner upload, custom fields and redirect
          destinations.
        </CardContent>
      </Card>
    </div>
  );
}
