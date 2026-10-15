import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Check, Circle, KeyRound } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { PasswordInput } from "@/components/site/password-input";
import { SiteLayout } from "@/components/site/site-layout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { friendlyError } from "@/lib/friendly-errors";
import { PASSWORD_MIN_LENGTH, PASSWORD_RULES, passwordProblems } from "@/lib/validation";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [{ title: "Reset password — ESWA staff" }, { name: "robots", content: "noindex" }],
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
    if (passwordProblems(password).length > 0) {
      toast.error(
        "Your password isn't strong enough yet. Please meet every rule in the checklist.",
      );
      return;
    }
    if (password !== confirm) {
      toast.error("The two passwords do not match.");
      return;
    }
    setPending(true);
    let failure: unknown = null;
    try {
      const { error } = await supabase.auth.updateUser({ password });
      failure = error;
    } catch (error) {
      failure = error;
    }
    setPending(false);
    if (failure) {
      toast.error(friendlyError(failure, "We couldn't save your new password. Please try again."));
      return;
    }
    toast.success("Password updated. You are signed in.");
    await navigate({ to: "/staff" });
  }

  const metCount = PASSWORD_RULES.filter((rule) => rule.test(password)).length;
  const strength = Math.round((metCount / PASSWORD_RULES.length) * 100);
  const confirmMatches = confirm.length > 0 && confirm === password;

  return (
    <SiteLayout>
      <div className="bg-hero-gradient min-h-[78vh]">
        <div className="mx-auto max-w-md px-4 pb-16 pt-14">
          <div className="flex flex-col items-center text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-soft">
              <KeyRound className="h-6 w-6" aria-hidden="true" />
            </span>
            <h1 className="mt-4 font-display text-2xl">Choose a new password</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              First time signing in? Set your own password here and you'll be signed in straight
              away.
            </p>
          </div>

          {ready ? (
            <form onSubmit={submit} className="card-surface mt-7 space-y-5 p-6">
              <div className="space-y-2">
                <Label htmlFor="new-password">New password</Label>
                <PasswordInput
                  id="new-password"
                  required
                  minLength={PASSWORD_MIN_LENGTH}
                  autoComplete="new-password"
                  aria-describedby="password-rules"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />

                <div
                  className="h-1.5 overflow-hidden rounded-full bg-muted"
                  role="presentation"
                  aria-hidden="true"
                >
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      strength === 100
                        ? "bg-success"
                        : strength >= 60
                          ? "bg-warning"
                          : "bg-destructive"
                    }`}
                    style={{ width: `${password ? Math.max(strength, 8) : 0}%` }}
                  />
                </div>

                <ul id="password-rules" className="space-y-1.5 rounded-lg bg-secondary/50 p-3">
                  {PASSWORD_RULES.map((rule) => {
                    const met = rule.test(password);
                    return (
                      <li
                        key={rule.id}
                        className={`flex items-center gap-2 text-sm transition-colors ${
                          met ? "font-medium text-success" : "text-muted-foreground"
                        }`}
                      >
                        {met ? (
                          <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
                        ) : (
                          <Circle className="h-4 w-4 shrink-0 opacity-50" aria-hidden="true" />
                        )}
                        <span>{rule.label}</span>
                        <span className="sr-only">{met ? "(done)" : "(not yet)"}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm new password</Label>
                <PasswordInput
                  id="confirm-password"
                  required
                  minLength={PASSWORD_MIN_LENGTH}
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
                {confirm.length > 0 && (
                  <p
                    className={`flex items-center gap-1.5 text-sm ${
                      confirmMatches ? "text-success" : "text-muted-foreground"
                    }`}
                  >
                    {confirmMatches ? (
                      <>
                        <Check className="h-4 w-4" aria-hidden="true" /> Both passwords match.
                      </>
                    ) : (
                      "The two passwords do not match yet."
                    )}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={pending}>
                {pending ? "Saving…" : "Save new password"}
              </Button>
            </form>
          ) : (
            <div className="card-surface mt-7 space-y-3 p-6 text-sm">
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
      </div>
    </SiteLayout>
  );
}
