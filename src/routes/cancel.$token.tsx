import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, CheckCircle2, Clock, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { SiteLayout } from "@/components/site/site-layout";
import { Button } from "@/components/ui/button";
import { NETWORK_ERROR_MESSAGE, postJson } from "@/lib/api-client";
import { formatWorkshopDate } from "@/lib/workshops";

export const Route = createFileRoute("/cancel/$token")({
  head: () => ({
    meta: [
      { title: "Your registration | ESWA Wellbeing Hub" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CancelPage,
});

type Registration = {
  name: string;
  title: string;
  startsAt: string;
  durationMinutes: number;
  location: string;
  joiningDetails: string | null;
  isPast: boolean;
};

type Stage = "loading" | "ready" | "missing" | "failed" | "cancelled";

function CancelPage() {
  const { token } = Route.useParams();
  const [stage, setStage] = useState<Stage>("loading");
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    setStage("loading");
    const reply = await postJson("/api/my-registration", { token, action: "view" });
    if (reply.networkError || reply.status === 503 || reply.status === 429) {
      setStage("failed");
      return;
    }
    if (!reply.ok) {
      setStage("missing");
      return;
    }
    setRegistration(reply.data["registration"] as Registration);
    setStage("ready");
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function cancel() {
    if (busy) return;
    setBusy(true);
    const reply = await postJson("/api/my-registration", { token, action: "cancel" });
    setBusy(false);
    if (reply.networkError) {
      toast.error(NETWORK_ERROR_MESSAGE);
      return;
    }
    if (reply.ok) {
      setStage("cancelled");
      return;
    }
    const code = String(reply.data["code"] ?? "");
    if (code === "closed")
      toast.error("This workshop has already taken place, so it can't be cancelled.");
    else if (code === "not_found") setStage("missing");
    else toast.error("We couldn't cancel just now. Please try again in a minute.");
  }

  return (
    <SiteLayout>
      <section className="mx-auto max-w-xl px-4 py-14">
        <div className="card-surface p-6">
          {stage === "loading" && (
            <p className="text-sm text-muted-foreground">Looking up your registration…</p>
          )}

          {stage === "failed" && (
            <div role="alert" className="text-center">
              <h1 className="font-display text-xl">We couldn't load your registration</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                This is usually a weak internet connection. Please try again.
              </p>
              <Button className="mt-4" onClick={() => void load()}>
                Try again
              </Button>
            </div>
          )}

          {stage === "missing" && (
            <div className="text-center">
              <h1 className="font-display text-xl">We can't find that registration</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                It may already be cancelled, or the link may be incomplete. Please open the link
                from your confirmation email again, or contact the ESWA office.
              </p>
              <Button asChild className="mt-4">
                <Link to="/workshops">See workshops</Link>
              </Button>
            </div>
          )}

          {stage === "cancelled" && (
            <div className="text-center" role="status">
              <CheckCircle2 className="mx-auto h-10 w-10 text-success" />
              <h1 className="mt-3 font-display text-xl">Your seat has been cancelled</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Thank you for letting us know. Someone else can now take your seat. You are always
                welcome to register for another session.
              </p>
              <Button asChild className="mt-4">
                <Link to="/workshops">See other workshops</Link>
              </Button>
            </div>
          )}

          {stage === "ready" && registration && (
            <div>
              <h1 className="font-display text-xl">Hello {registration.name}</h1>
              <p className="mt-1 text-sm text-muted-foreground">Here is your registration.</p>
              <div className="mt-4 space-y-2 rounded-lg bg-secondary/60 p-4 text-sm">
                <p className="font-medium">{registration.title}</p>
                <p className="flex items-center gap-2 text-muted-foreground">
                  <CalendarDays className="h-4 w-4 text-primary" />{" "}
                  {formatWorkshopDate(registration.startsAt)}
                </p>
                <p className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4 text-primary" /> {registration.durationMinutes} minutes
                </p>
                <p className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4 text-primary" /> {registration.location}
                </p>
                {registration.joiningDetails && (
                  <p className="whitespace-pre-line border-t border-border pt-2">
                    <span className="font-medium">How to join: </span>
                    {registration.joiningDetails}
                  </p>
                )}
              </div>

              {registration.isPast ? (
                <p className="mt-5 text-sm text-muted-foreground">
                  This workshop has already taken place, so it can no longer be cancelled.
                </p>
              ) : (
                <div className="mt-5">
                  <p className="text-sm text-muted-foreground">
                    Can't make it? Cancelling frees your seat for another teacher.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-3">
                    <Button variant="destructive" onClick={() => void cancel()} disabled={busy}>
                      {busy ? "Cancelling…" : "Cancel my seat"}
                    </Button>
                    <Button asChild variant="secondary">
                      <Link to="/">Keep my seat</Link>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}
