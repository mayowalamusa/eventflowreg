import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const searchSchema = z.object({
  mode: z.enum(["login", "signup", "forgot"]).optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Sign in — EventFlow" },
      {
        name: "description",
        content: "Log in or create your EventFlow account to publish event registration pages.",
      },
      { property: "og:title", content: "Sign in — EventFlow" },
      { property: "og:description", content: "Access your EventFlow host dashboard." },
    ],
  }),
  component: AuthPage,
});

const emailSchema = z.string().trim().email("Enter a valid email").max(255);
const passwordSchema = z.string().min(8, "Password must be at least 8 characters").max(72);

function AuthPage() {
  const { mode } = Route.useSearch();
  const navigate = useNavigate();
  const { session } = useAuth();
  const [tab, setTab] = useState(mode === "signup" ? "signup" : "login");

  useEffect(() => {
    if (session) navigate({ to: "/dashboard", replace: true });
  }, [session, navigate]);

  return (
    <div className="flex min-h-screen flex-col bg-muted/40">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-hero-gradient text-sm font-bold text-primary-foreground">
            EF
          </span>
          <span className="text-xl font-semibold tracking-tight">EventFlow</span>
        </Link>

        {mode === "forgot" ? (
          <ForgotPasswordCard />
        ) : (
          <Card className="shadow-lift">
            <CardHeader className="space-y-1">
              <CardTitle className="text-xl">Welcome</CardTitle>
              <CardDescription>Host events and collect registrations in minutes.</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={tab} onValueChange={setTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Log in</TabsTrigger>
                  <TabsTrigger value="signup">Sign up</TabsTrigger>
                </TabsList>
                <TabsContent value="login" className="pt-4">
                  <LoginForm />
                </TabsContent>
                <TabsContent value="signup" className="pt-4">
                  <SignUpForm />
                </TabsContent>
              </Tabs>

              <div className="my-5 flex items-center gap-3">
                <span className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground">or</span>
                <span className="h-px flex-1 bg-border" />
              </div>
              <GoogleButton />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function GoogleButton() {
  const [loading, setLoading] = useState(false);
  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        const result = await lovable.auth.signInWithOAuth("google", {
          redirect_uri: window.location.origin,
        });
        if (result.error) {
          setLoading(false);
          toast.error("Google sign-in failed. Please try again.");
        }
      }}
    >
      Continue with Google
    </Button>
  );
}

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        const parsed = z.object({ email: emailSchema, password: z.string().min(1) }).safeParse({
          email,
          password,
        });
        if (!parsed.success) {
          toast.error(parsed.error.issues[0].message);
          return;
        }
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword(parsed.data);
        setLoading(false);
        if (error) {
          toast.error(error.message);
          return;
        }
        toast.success("Welcome back!");
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="login-email">Email</Label>
        <Input
          id="login-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="login-password">Password</Label>
          <Link
            to="/auth"
            search={{ mode: "forgot" }}
            className="text-xs text-primary hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <Input
          id="login-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Signing in…" : "Log in"}
      </Button>
    </form>
  );
}

function SignUpForm() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <div className="rounded-xl border border-border bg-muted/50 p-4 text-sm">
        <p className="font-medium">Check your email</p>
        <p className="mt-1 text-muted-foreground">
          We sent a verification link to <strong>{email}</strong>. Confirm it to activate your
          account.
        </p>
      </div>
    );
  }

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        const parsed = z
          .object({
            fullName: z.string().trim().min(2, "Enter your name").max(100),
            email: emailSchema,
            password: passwordSchema,
          })
          .safeParse({ fullName, email, password });
        if (!parsed.success) {
          toast.error(parsed.error.issues[0].message);
          return;
        }
        setLoading(true);
        const { error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: parsed.data.fullName },
          },
        });
        setLoading(false);
        if (error) {
          toast.error(error.message);
          return;
        }
        setSent(true);
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="signup-name">Full name</Label>
        <Input
          id="signup-name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-email">Email</Label>
        <Input
          id="signup-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-password">Password</Label>
        <Input
          id="signup-password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}

function ForgotPasswordCard() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  return (
    <Card className="shadow-lift">
      <CardHeader className="space-y-1">
        <CardTitle className="text-xl">Reset your password</CardTitle>
        <CardDescription>We'll email you a secure link to choose a new one.</CardDescription>
      </CardHeader>
      <CardContent>
        {sent ? (
          <div className="rounded-xl border border-border bg-muted/50 p-4 text-sm text-muted-foreground">
            If an account exists for {email}, a reset link is on its way.
          </div>
        ) : (
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              const parsed = emailSchema.safeParse(email);
              if (!parsed.success) {
                toast.error(parsed.error.issues[0].message);
                return;
              }
              setLoading(true);
              await supabase.auth.resetPasswordForEmail(parsed.data, {
                redirectTo: `${window.location.origin}/reset-password`,
              });
              setLoading(false);
              setSent(true);
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="forgot-email">Email</Label>
              <Input
                id="forgot-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Sending…" : "Send reset link"}
            </Button>
          </form>
        )}
        <div className="mt-4 text-center">
          <Link to="/auth" className="text-sm text-primary hover:underline">
            Back to log in
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
