import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, LinkIcon, Sheet, ShieldCheck, Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EventFlow — Beautiful event registration pages in minutes" },
      {
        name: "description",
        content:
          "Create a registration page, collect attendee details, sync to Google Sheets and send people straight to WhatsApp, Zoom or Telegram.",
      },
      { property: "og:title", content: "EventFlow — Event registration made simple" },
      {
        property: "og:description",
        content:
          "Registration pages for webinars, churches, coaches and communities. Collect attendees and route them anywhere.",
      },
    ],
  }),
  component: Landing,
});

const features = [
  {
    icon: CalendarDays,
    title: "Publish in minutes",
    body: "Title, banner, date, timezone and you're live on your own event URL.",
  },
  {
    icon: Users,
    title: "Custom registration forms",
    body: "Default name, email and phone plus any custom field you need.",
  },
  {
    icon: LinkIcon,
    title: "Smart redirects",
    body: "Send attendees to WhatsApp, Telegram, Zoom, Meet, Teams or a custom link.",
  },
  {
    icon: Sheet,
    title: "Live Google Sheets sync",
    body: "Every registration lands in your spreadsheet in real time.",
  },
  {
    icon: ShieldCheck,
    title: "Roles built in",
    body: "Hosts manage their own events, admins oversee the whole platform.",
  },
  {
    icon: Sparkles,
    title: "Ready to grow",
    body: "Structured for paid events, QR codes, certificates and analytics next.",
  },
];

function Landing() {
  const { session } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-xl bg-hero-gradient text-sm font-bold text-primary-foreground">
              EF
            </span>
            <span className="text-lg font-semibold tracking-tight">EventFlow</span>
          </Link>
          {session ? (
            <Button asChild size="sm">
              <Link to="/dashboard">Go to dashboard</Link>
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button asChild variant="ghost" size="sm">
                <Link to="/auth">Log in</Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/auth" search={{ mode: "signup" }}>
                  Get started
                </Link>
              </Button>
            </div>
          )}
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
              <Sparkles className="size-3.5" /> Built for webinars, churches, coaches & communities
            </span>
            <h1 className="mt-6 text-4xl leading-tight font-extrabold sm:text-6xl">
              Event registration pages that actually convert
            </h1>
            <p className="mt-5 text-base text-muted-foreground sm:text-lg">
              Create your event, share one link, and collect attendee details. EventFlow syncs every
              registration to your Google Sheet and sends people straight to where the event lives.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link to="/auth" search={{ mode: "signup" }}>
                  Create your first event
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/auth">I already have an account</Link>
              </Button>
            </div>
          </div>

          <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <Card key={f.title} className="border-border/70 shadow-soft">
                <CardContent className="p-6">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                    <f.icon className="size-5" />
                  </span>
                  <h3 className="mt-4 text-base font-semibold">{f.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border/70 py-8">
        <div className="mx-auto max-w-6xl px-4 text-sm text-muted-foreground">
          © {new Date().getFullYear()} EventFlow
        </div>
      </footer>
    </div>
  );
}
