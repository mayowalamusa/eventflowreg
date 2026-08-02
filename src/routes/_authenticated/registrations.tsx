import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/registrations")({
  head: () => ({
    meta: [
      { title: "Registrations — EventFlow" },
      { name: "description", content: "View and search everyone registered for your events." },
      { property: "og:title", content: "Registrations — EventFlow" },
      {
        property: "og:description",
        content: "View and search everyone registered for your events.",
      },
    ],
  }),
  component: RegistrationsPage,
});

function RegistrationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Registrations</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          A live, searchable table of attendees lands in the next step.
        </p>
      </div>
      <Card className="shadow-soft">
        <CardContent className="p-10 text-center text-sm text-muted-foreground">
          Coming next: real-time attendee table with search and Google Sheets sync status.
        </CardContent>
      </Card>
    </div>
  );
}
