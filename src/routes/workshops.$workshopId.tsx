import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, CheckCircle2, Clock, MapPin, User, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { FieldError } from "@/components/site/field-error";
import { SiteLayout } from "@/components/site/site-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NETWORK_ERROR_MESSAGE, postJson } from "@/lib/api-client";
import {
  fetchRegistrationCounts,
  fetchWorkshop,
  formatWorkshopDate,
  provinces,
} from "@/lib/workshops";
import { validateRegistration, type RegistrationErrors } from "@/lib/validation";

export const Route = createFileRoute("/workshops/$workshopId")({
  head: () => ({
    meta: [
      { title: "Workshop details and RSVP — ESWA" },
      {
        name: "description",
        content:
          "See the full details of this ESWA educator wellbeing workshop and reserve your seat in under a minute.",
      },
      { property: "og:title", content: "Workshop details and RSVP — ESWA" },
      {
        property: "og:description",
        content: "Date, time, venue, facilitator and free registration for this ESWA workshop.",
      },
    ],
  }),
  component: WorkshopDetail,
});

type FormState = {
  full_name: string;
  email: string;
  phone: string;
  school: string;
  role_at_school: string;
  province: string;
  dietary_or_access_needs: string;
};

const emptyForm: FormState = {
  full_name: "",
  email: "",
  phone: "",
  school: "",
  role_at_school: "",
  province: "",
  dietary_or_access_needs: "",
};

type Outcome = { emailStatus: "sent" | "not_sent"; email: string };

const SERVER_MESSAGES: { [code: string]: string } = {
  too_many: "You've tried a few times in a row. Please wait a few minutes and try again.",
  already_registered:
    "This email address is already registered for this workshop. Check your inbox for the confirmation.",
  workshop_full: "Sorry, this workshop has just filled up. Please look at our other workshops.",
  workshop_unavailable: "This workshop is no longer open for registration.",
  workshop_closed: "This workshop has already taken place.",
  unavailable:
    "We couldn't save your registration just now. Nothing was lost. Please try again in a minute.",
  bad_request:
    "Something about that request didn't look right. Please refresh the page and try again.",
};

function WorkshopDetail() {
  const { workshopId } = Route.useParams();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<RegistrationErrors>({});
  const [attempted, setAttempted] = useState(false);
  const [trap, setTrap] = useState("");
  const [outcome, setOutcome] = useState<Outcome | null>(null);

  const {
    data: workshop,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["workshop", workshopId],
    queryFn: () => fetchWorkshop(workshopId),
  });
  const { data: counts } = useQuery({
    queryKey: ["workshops", "counts"],
    queryFn: fetchRegistrationCounts,
  });

  const registered = counts?.get(workshopId) ?? 0;
  const seatsLeft = workshop ? Math.max(workshop.capacity - registered, 0) : 0;
  const isPast = workshop ? new Date(workshop.starts_at).getTime() < Date.now() : false;

  const register = useMutation({
    mutationFn: async () => {
      const reply = await postJson("/api/register", {
        ...form,
        workshop_id: workshopId,
        website: trap,
      });
      if (reply.networkError) throw new Error("network");
      if (!reply.ok) {
        const fieldErrors = reply.data["errors"] as RegistrationErrors | undefined;
        if (reply.data["code"] === "invalid" && fieldErrors) {
          setErrors(fieldErrors);
          throw new Error("fields");
        }
        const code = String(reply.data["code"] ?? "unavailable");
        const failure = new Error(code);
        throw failure;
      }
      return {
        emailStatus: reply.data["emailStatus"] === "sent" ? "sent" : "not_sent",
        email: form.email.trim().toLowerCase(),
      } as Outcome;
    },
    onSuccess: (result) => {
      setOutcome(result);
      setForm(emptyForm);
      setErrors({});
      setAttempted(false);
      queryClient.invalidateQueries({ queryKey: ["workshops", "counts"] });
      toast.success("Your seat is reserved.");
    },
    onError: (error: Error) => {
      if (error.message === "fields") {
        toast.error("Please check the highlighted fields.");
        return;
      }
      if (error.message === "network") {
        toast.error(NETWORK_ERROR_MESSAGE);
        return;
      }
      if (error.message === "workshop_full") {
        queryClient.invalidateQueries({ queryKey: ["workshops", "counts"] });
      }
      toast.error(
        SERVER_MESSAGES[error.message] ??
          "We couldn't save your registration just now. Please try again in a minute.",
      );
    },
  });

  function update<K extends keyof FormState>(key: K, value: string) {
    const next = { ...form, [key]: value };
    setForm(next);
    if (attempted) setErrors(validateRegistration(next).errors);
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (register.isPending) return;
    setAttempted(true);
    const result = validateRegistration(form);
    setErrors(result.errors);
    const firstBad = Object.keys(result.errors)[0];
    if (firstBad) {
      toast.error("Please check the highlighted fields.");
      document.getElementById(firstBad)?.focus();
      return;
    }
    register.mutate();
  }

  function describe(field: keyof RegistrationErrors) {
    return errors[field] ? `${field}-error` : undefined;
  }

  if (isLoading) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-3xl px-4 py-16 text-sm text-muted-foreground">
          Loading workshop…
        </div>
      </SiteLayout>
    );
  }

  if (isError) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-3xl px-4 py-16 text-center">
          <h1 className="font-display text-2xl">We couldn't load this workshop</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This is usually a weak internet connection. Please try again.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Button onClick={() => void refetch()}>Try again</Button>
            <Button asChild variant="secondary">
              <Link to="/workshops">Back to workshops</Link>
            </Button>
          </div>
        </div>
      </SiteLayout>
    );
  }

  if (!workshop) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-3xl px-4 py-16 text-center">
          <h1 className="font-display text-2xl">We couldn't find that workshop</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            It may have been removed or the link may be incomplete.
          </p>
          <Button asChild className="mt-4">
            <Link to="/workshops">See all workshops</Link>
          </Button>
        </div>
      </SiteLayout>
    );
  }

  const closedReason = isPast
    ? "This workshop has already taken place."
    : seatsLeft === 0
      ? "This workshop is fully booked."
      : null;

  return (
    <SiteLayout>
      <section className="bg-hero-gradient">
        <div className="mx-auto max-w-3xl px-4 py-12">
          <Badge variant="secondary">{workshop.programme}</Badge>
          <h1 className="mt-3 text-3xl sm:text-4xl">{workshop.title}</h1>
          <div className="mt-5 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
            <p className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" />
              {formatWorkshopDate(workshop.starts_at)}
            </p>
            <p className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" /> {workshop.duration_minutes} minutes
            </p>
            <p className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" /> {workshop.location}
            </p>
            <p className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" /> {registered} registered · {seatsLeft} seat
              {seatsLeft === 1 ? "" : "s"} left
            </p>
            {workshop.facilitator && (
              <p className="flex items-center gap-2">
                <User className="h-4 w-4 text-primary" /> {workshop.facilitator}
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-10">
        <p className="text-sm text-muted-foreground">{workshop.description}</p>
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-16">
        <div className="card-surface p-6">
          {outcome ? (
            <div className="text-center" role="status">
              <CheckCircle2 className="mx-auto h-10 w-10 text-success" />
              <h2 className="mt-3 font-display text-xl">You're on the list</h2>
              {outcome.emailStatus === "sent" ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  We've sent a confirmation to <strong>{outcome.email}</strong>. If you can't see it
                  in a few minutes, please check your spam or junk folder.
                </p>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">
                  Your seat is saved. We couldn't send the confirmation email just now, so please
                  take a screenshot of the details below. The ESWA team can also confirm your
                  booking if you contact us.
                </p>
              )}
              <div className="mx-auto mt-4 max-w-sm rounded-lg bg-secondary/60 p-4 text-left text-sm">
                <p className="font-medium">{workshop.title}</p>
                <p className="mt-1 text-muted-foreground">
                  {formatWorkshopDate(workshop.starts_at)}
                </p>
                <p className="text-muted-foreground">{workshop.location}</p>
              </div>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <Button asChild variant="secondary">
                  <Link to="/workshops">Other workshops</Link>
                </Button>
                <Button asChild>
                  <Link to="/feedback">Share feedback</Link>
                </Button>
              </div>
            </div>
          ) : closedReason ? (
            <div className="text-center">
              <h2 className="font-display text-xl">Registration is closed</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {closedReason} Please look at our other workshops, or contact ESWA to ask about
                future dates.
              </p>
              <Button asChild className="mt-4">
                <Link to="/workshops">See other workshops</Link>
              </Button>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={onSubmit} noValidate>
              <div>
                <h2 className="font-display text-xl">Reserve your seat</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  No account needed. Fields marked * are required. We only use these details to run
                  the workshop and report on impact.
                </p>
              </div>

              {/* Bot trap: hidden from people, visible to simple bots. Leave it empty. */}
              <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
                <label htmlFor="website">Website</label>
                <input
                  id="website"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  value={trap}
                  onChange={(e) => setTrap(e.target.value)}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full name *</Label>
                  <Input
                    id="full_name"
                    autoComplete="name"
                    maxLength={120}
                    aria-invalid={Boolean(errors.full_name)}
                    aria-describedby={describe("full_name")}
                    value={form.full_name}
                    onChange={(e) => update("full_name", e.target.value)}
                  />
                  <FieldError id="full_name-error" message={errors.full_name} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    maxLength={254}
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={describe("email")}
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                  />
                  <FieldError id="email-error" message={errors.email} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone (optional)</Label>
                  <Input
                    id="phone"
                    type="tel"
                    autoComplete="tel"
                    maxLength={30}
                    aria-invalid={Boolean(errors.phone)}
                    aria-describedby={describe("phone")}
                    value={form.phone}
                    onChange={(e) => update("phone", e.target.value)}
                  />
                  <FieldError id="phone-error" message={errors.phone} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="school">School or organisation (optional)</Label>
                  <Input
                    id="school"
                    maxLength={160}
                    aria-invalid={Boolean(errors.school)}
                    aria-describedby={describe("school")}
                    value={form.school}
                    onChange={(e) => update("school", e.target.value)}
                  />
                  <FieldError id="school-error" message={errors.school} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role_at_school">Your role (optional)</Label>
                  <Input
                    id="role_at_school"
                    placeholder="Teacher, HOD, principal…"
                    maxLength={120}
                    aria-invalid={Boolean(errors.role_at_school)}
                    aria-describedby={describe("role_at_school")}
                    value={form.role_at_school}
                    onChange={(e) => update("role_at_school", e.target.value)}
                  />
                  <FieldError id="role_at_school-error" message={errors.role_at_school} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="province">Province (optional)</Label>
                  <select
                    id="province"
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
                    aria-invalid={Boolean(errors.province)}
                    aria-describedby={describe("province")}
                    value={form.province}
                    onChange={(e) => update("province", e.target.value)}
                  >
                    <option value="">Select a province</option>
                    {provinces.map((province) => (
                      <option key={province} value={province}>
                        {province}
                      </option>
                    ))}
                  </select>
                  <FieldError id="province-error" message={errors.province} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dietary_or_access_needs">
                  Dietary or accessibility needs (optional)
                </Label>
                <Textarea
                  id="dietary_or_access_needs"
                  maxLength={500}
                  aria-invalid={Boolean(errors.dietary_or_access_needs)}
                  aria-describedby={describe("dietary_or_access_needs")}
                  value={form.dietary_or_access_needs}
                  onChange={(e) => update("dietary_or_access_needs", e.target.value)}
                />
                <FieldError
                  id="dietary_or_access_needs-error"
                  message={errors.dietary_or_access_needs}
                />
              </div>

              <Button type="submit" size="lg" disabled={register.isPending}>
                {register.isPending ? "Reserving your seat…" : "Confirm my RSVP"}
              </Button>
            </form>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}
