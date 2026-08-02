import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin — EventFlow" },
      { name: "description", content: "Platform oversight of users, events and registrations." },
      { property: "og:title", content: "Admin — EventFlow" },
      {
        property: "og:description",
        content: "Platform oversight of users, events and registrations.",
      },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { role } = useAuth();

  if (role !== "admin") {
    return (
      <Card className="shadow-soft">
        <CardContent className="p-10 text-center text-sm text-muted-foreground">
          You need administrator access to view this page.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Admin</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          User, event and registration oversight arrives in a later step.
        </p>
      </div>
      <Card className="shadow-soft">
        <CardContent className="p-10 text-center text-sm text-muted-foreground">
          Coming next: user list with suspension controls and platform-wide event management.
        </CardContent>
      </Card>
    </div>
  );
}
