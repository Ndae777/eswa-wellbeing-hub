import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { FieldError } from "@/components/site/field-error";
import { ScaleInput } from "@/components/site/scale-input";
import { PageBanner } from "@/components/site/site-images";
import { SiteLayout } from "@/components/site/site-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NETWORK_ERROR_MESSAGE, postJson } from "@/lib/api-client";
import { validateFeedback, type FeedbackErrors } from "@/lib/validation";
import { fetchUpcomingWorkshops } from "@/lib/workshops";

export const Route = createFileRoute("/feedback")({
  head: () => ({
    meta: [
      { title: "Questionnaire and feedback — ESWA" },
      {
        name: "description",
        content:
          "Tell ESWA how our workshops helped and what we should improve. The questionnaire takes about three minutes.",
      },
      { property: "og:title", content: "Questionnaire and feedback — ESWA" },
      {
        property: "og:description",
        content: "Rate your wellbeing before and after, and shape our next programmes.",
      },
    ],
  }),
  component: FeedbackPage,
});

type FormState = {
  full_name: string;
  email: string;
  school: string;
  role_at_school: string;
  workshop_id: string;
  overall_rating: number | null;
  stress_level: number | null;
  wellbeing_before: number | null;
  wellbeing_after: number | null;
  would_recommend: boolean | null;
  most_valuable: string;
  improvements: string;
  future_topics: string;
};

// Nothing is pre-selected. Ratings start empty so every number in our impact
// reports comes from a real answer, not a default.
const initial: FormState = {
  full_name: "",
  email: "",
  school: "",
  role_at_school: "",
  workshop_id: "",
  overall_rating: null,
  stress_level: null,
  wellbeing_before: null,
  wellbeing_after: null,
  would_recommend: null,
  most_valuable: "",
  improvements: "",
  future_topics: "",
};

const SERVER_MESSAGES: { [code: string]: string } = {
  too_many: "You've sent a few responses in a row. Please wait a few minutes and try again.",
  unavailable: "We couldn't save your feedback just now. Please try again in a minute.",
  bad_request:
    "Something about that request didn't look right. Please refresh the page and try again.",
};

function FeedbackPage() {
  const [form, setForm] = useState<FormState>(initial);
  const [errors, setErrors] = useState<FeedbackErrors>({});
  const [attempted, setAttempted] = useState(false);
  const [trap, setTrap] = useState("");
  const [done, setDone] = useState(false);
  const { data: workshops } = useQuery({
    queryKey: ["workshops", "for-feedback"],
    queryFn: () => fetchUpcomingWorkshops(),
  });

  const submit = useMutation({
    mutationFn: async () => {
      const reply = await postJson("/api/feedback", { ...form, website: trap });
      if (reply.networkError) throw new Error("network");
      if (!reply.ok) {
        const fieldErrors = reply.data["errors"] as FeedbackErrors | undefined;
        if (reply.data["code"] === "invalid" && fieldErrors) {
          setErrors(fieldErrors);
          throw new Error("fields");
        }
        throw new Error(String(reply.data["code"] ?? "unavailable"));
      }
    },
    onSuccess: () => {
      setDone(true);
      toast.success("Thank you. Your feedback has been sent to ESWA.");
    },
    onError: (error: Error) => {
      if (error.message === "fields") {
        toast.error("Please check the highlighted answers.");
      } else if (error.message === "network") {
        toast.error(NETWORK_ERROR_MESSAGE);
      } else {
        toast.error(
          SERVER_MESSAGES[error.message] ??
            "We couldn't save your feedback just now. Please try again in a minute.",
        );
      }
    },
  });

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    const next = { ...form, [key]: value };
    setForm(next);
    if (attempted) setErrors(validateFeedback(next).errors);
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (submit.isPending) return;
    setAttempted(true);
    const result = validateFeedback(form);
    setErrors(result.errors);
    const firstBad = Object.keys(result.errors)[0];
    if (firstBad) {
      toast.error("Please check the highlighted answers.");
      const target = firstBad === "wellbeing" ? "wellbeing_before" : firstBad;
      document.getElementById(target)?.focus();
      return;
    }
    submit.mutate();
  }

  return (
    <SiteLayout>
      <PageBanner slot="page-feedback">
        <div className="mx-auto max-w-3xl px-4 py-12">
          <h1 className="text-3xl sm:text-4xl">Your voice shapes our work</h1>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            About three minutes. You may answer anonymously. The only required question is your
            overall rating (marked *).
          </p>
        </div>
      </PageBanner>

      <section className="mx-auto max-w-3xl px-4 py-10 pb-16">
        {done ? (
          <div className="card-surface p-8 text-center" role="status">
            <CheckCircle2 className="mx-auto h-10 w-10 text-success" />
            <h2 className="mt-3 font-display text-xl">Feedback received</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Thank you for helping ESWA improve. Your answers go straight to our team. We don't
              send you an email for this form.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Button asChild variant="secondary">
                <Link to="/resources">Explore resources</Link>
              </Button>
              <Button asChild>
                <Link to="/workshops">Find a workshop</Link>
              </Button>
            </div>
          </div>
        ) : (
          <form className="card-surface space-y-7 p-6" onSubmit={onSubmit} noValidate>
            {/* Bot trap: hidden from people. Leave it empty. */}
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
                <Label htmlFor="full_name">Name (optional)</Label>
                <Input
                  id="full_name"
                  autoComplete="name"
                  maxLength={120}
                  aria-invalid={Boolean(errors.full_name)}
                  aria-describedby={errors.full_name ? "full_name-error" : undefined}
                  value={form.full_name}
                  onChange={(e) => update("full_name", e.target.value)}
                />
                <FieldError id="full_name-error" message={errors.full_name} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email (optional)</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  maxLength={254}
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                />
                <FieldError id="email-error" message={errors.email} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="school">School or organisation (optional)</Label>
                <Input
                  id="school"
                  maxLength={160}
                  aria-invalid={Boolean(errors.school)}
                  aria-describedby={errors.school ? "school-error" : undefined}
                  value={form.school}
                  onChange={(e) => update("school", e.target.value)}
                />
                <FieldError id="school-error" message={errors.school} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role_at_school">Your role (optional)</Label>
                <Input
                  id="role_at_school"
                  maxLength={120}
                  aria-invalid={Boolean(errors.role_at_school)}
                  aria-describedby={errors.role_at_school ? "role_at_school-error" : undefined}
                  value={form.role_at_school}
                  onChange={(e) => update("role_at_school", e.target.value)}
                />
                <FieldError id="role_at_school-error" message={errors.role_at_school} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="workshop_id">Which workshop is this about?</Label>
              <select
                id="workshop_id"
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={form.workshop_id}
                onChange={(e) => update("workshop_id", e.target.value)}
              >
                <option value="">General feedback about ESWA</option>
                {(workshops ?? []).map((workshop) => (
                  <option key={workshop.id} value={workshop.id}>
                    {workshop.title}
                  </option>
                ))}
              </select>
              <FieldError id="workshop_id-error" message={errors.workshop_id} />
            </div>

            <ScaleInput
              id="overall_rating"
              label="Overall, how would you rate your experience with ESWA? *"
              large
              stepLabels={["Poor", "Fair", "Good", "Very good", "Excellent"]}
              max={5}
              value={form.overall_rating}
              onChange={(value) => update("overall_rating", value)}
              error={errors.overall_rating}
            />
            <ScaleInput
              id="stress_level"
              label="How stressed do you feel in your work at the moment? (optional)"
              lowLabel="1 = very calm"
              highLabel="10 = overwhelmed"
              max={10}
              value={form.stress_level}
              onChange={(value) => update("stress_level", value)}
              error={errors.stress_level}
            />
            <div className="space-y-5">
              <ScaleInput
                id="wellbeing_before"
                label="Your wellbeing BEFORE the workshop (optional)"
                lowLabel="1 = very low"
                highLabel="10 = thriving"
                max={10}
                value={form.wellbeing_before}
                onChange={(value) => update("wellbeing_before", value)}
                error={errors.wellbeing}
              />
              <ScaleInput
                id="wellbeing_after"
                label="Your wellbeing AFTER the workshop (optional)"
                lowLabel="1 = very low"
                highLabel="10 = thriving"
                max={10}
                value={form.wellbeing_after}
                onChange={(value) => update("wellbeing_after", value)}
              />
            </div>

            <div className="space-y-2">
              <Label id="recommend-label">
                Would you recommend ESWA to a colleague? (optional)
              </Label>
              <div role="group" aria-labelledby="recommend-label" className="flex gap-2">
                {[
                  { label: "Yes", value: true },
                  { label: "Not yet", value: false },
                ].map((option) => (
                  <button
                    key={option.label}
                    type="button"
                    aria-pressed={form.would_recommend === option.value}
                    onClick={() =>
                      update(
                        "would_recommend",
                        form.would_recommend === option.value ? null : option.value,
                      )
                    }
                    className={`rounded-full border-2 px-6 py-2 text-sm font-medium transition ${
                      form.would_recommend === option.value
                        ? "border-primary bg-primary text-primary-foreground shadow-lift"
                        : "border-primary/25 bg-background hover:border-primary/60 hover:bg-accent"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="most_valuable">What was most valuable for you? (optional)</Label>
              <Textarea
                id="most_valuable"
                maxLength={1000}
                value={form.most_valuable}
                onChange={(e) => update("most_valuable", e.target.value)}
              />
              <FieldError id="most_valuable-error" message={errors.most_valuable} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="improvements">What should ESWA improve? (optional)</Label>
              <Textarea
                id="improvements"
                maxLength={1000}
                value={form.improvements}
                onChange={(e) => update("improvements", e.target.value)}
              />
              <FieldError id="improvements-error" message={errors.improvements} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="future_topics">
                Which topics would help you most next? (optional)
              </Label>
              <Textarea
                id="future_topics"
                maxLength={1000}
                value={form.future_topics}
                onChange={(e) => update("future_topics", e.target.value)}
              />
              <FieldError id="future_topics-error" message={errors.future_topics} />
            </div>

            <Button type="submit" size="lg" disabled={submit.isPending}>
              {submit.isPending ? "Sending…" : "Send my feedback"}
            </Button>
          </form>
        )}
      </section>
    </SiteLayout>
  );
}
