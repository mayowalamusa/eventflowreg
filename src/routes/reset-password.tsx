import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Choose a new password — EventFlow" },
      { name: "description", content: "Set a new password for your EventFlow account." },
      { property: "og:title", content: "Choose a new password — EventFlow" },
      { property: "og:description", content: "Set a new password for your EventFlow account." },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-md shadow-lift">
        <CardHeader className="space-y-1">
          <CardTitle className="text-xl">Choose a new password</CardTitle>
          <CardDescription>Enter a password of at least 8 characters.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              const parsed = z
                .object({
                  password: z.string().min(8, "Password must be at least 8 characters").max(72),
                  confirm: z.string(),
                })
                .refine((v) => v.password === v.confirm, { message: "Passwords do not match" })
                .safeParse({ password, confirm });
              if (!parsed.success) {
                toast.error(parsed.error.issues[0]?.message);
                return;
              }
              setLoading(true);
              const { error } = await supabase.auth.updateUser({ password });
              setLoading(false);
              if (error) {
                toast.error(error.message);
                return;
              }
              toast.success("Password updated");
              navigate({ to: "/dashboard", replace: true });
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="new-password">New password</Label>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm password</Label>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Updating…" : "Update password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
