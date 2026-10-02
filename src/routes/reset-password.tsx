import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { SiteLayout } from "@/components/site/site-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset password — ESWA staff" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPassword,
});

// Supabase puts errors (expired or reused links) in the URL hash.
function linkErrorFromHash(): string | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const description = params.get("error_description");
  return description ? description.replace(/\+/g, " ") : null;
}

function ResetPassword() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [checked, setChecked] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setLinkError(linkErrorFromHash());
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
      setChecked(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (password.length < 8) {
      toast.error("Use at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      toast.error("The two passwords do not match.");
      return;
    }
    setPending(true);
    const { error } = await supabase.auth.updateUser({ password });
    setPending(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password updated. You are signed in.");
    await navigate({ to: "/staff" });
  }

  return (
    <SiteLayout>
      <div className="mx-auto max-w-md px-4 py-14">
        <h1 className="font-display text-2xl">Choose a new password</h1>

        {ready ? (
          <form onSubmit={submit} className="card-surface mt-6 space-y-4 p-6">
            <div className="space-y-2">
              <Label htmlFor="new-password">New password</Label>
              <Input
                id="new-password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm new password</Label>
              <Input
                id="confirm-password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={pending}>
              Save new password
            </Button>
          </form>
        ) : (
          <div className="card-surface mt-6 space-y-3 p-6 text-sm">
            {!checked ? (
              <p className="text-muted-foreground">Checking your reset link…</p>
            ) : (
              <>
                <p className="text-muted-foreground">
                  {linkError ?? "This reset link is missing, expired or has already been used."}
                </p>
                <Link to="/staff" className="font-medium text-primary hover:underline">
                  Back to staff sign in to request a new link
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </SiteLayout>
  );
}
