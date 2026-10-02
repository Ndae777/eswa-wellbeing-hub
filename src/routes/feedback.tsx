import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { SiteLayout } from "@/components/site/site-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
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
  overall_rating: number;
  stress_level: number;
  wellbeing_before: number;
  wellbeing_after: number;
  would_recommend: boolean;
  most_valuable: string;
  improvements: string;
  future_topics: string;
};

const initial: FormState = {
  full_name: "",
  email: "",
  school: "",
  role_at_school: "",
  workshop_id: "",
  overall_rating: 4,
  stress_level: 5,
  wellbeing_before: 5,
  wellbeing_after: 7,
  would_recommend: true,
  most_valuable: "",
  improvements: "",
  future_topics: "",
};

function Scale({
  id,
  label,
  hint,
  max,
  value,
  onChange,
}: {
  id: string;
  label: string;
  hint: string;
  max: number;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <p className="text-xs text-muted-foreground">{hint}</p>
      <div className="flex flex-wrap gap-2" id={id}>
        {Array.from({ length: max }, (_, index) => index + 1).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            aria-pressed={value === option}
            className={`h-9 w-9 rounded-md border text-sm font-medium transition ${
              value === option
                ? "border-primary bg-primary text-primary-foreground"
                : "border-input bg-background text-foreground hover:bg-accent"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function FeedbackPage() {
  const [form, setForm] = useState<FormState>(initial);
  const [done, setDone] = useState(false);
  const { data: workshops } = useQuery({
    queryKey: ["workshops", "for-feedback"],
    queryFn: () => fetchUpcomingWorkshops(),
  });

  const submit = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("feedback").insert({
        full_name: form.full_name.trim() || null,
        email: form.email.trim().toLowerCase() || null,
        school: form.school.trim() || null,
        role_at_school: form.role_at_school.trim() || null,
        workshop_id: form.workshop_id || null,
        overall_rating: form.overall_rating,
        stress_level: form.stress_level,
        wellbeing_before: form.wellbeing_before,
        wellbeing_after: form.wellbeing_after,
        would_recommend: form.would_recommend,
        most_valuable: form.most_valuable.trim() || null,
        improvements: form.improvements.trim() || null,
        future_topics: form.future_topics.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setDone(true);
      toast.success("Thank you — your feedback has been sent to ESWA.");
    },
    onError: () => toast.error("We could not send your feedback. Please try again."),
  });

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <SiteLayout>
      <section className="bg-hero-gradient">
        <div className="mx-auto max-w-3xl px-4 py-12">
          <h1 className="text-3xl sm:text-4xl">Your voice shapes our work</h1>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            About three minutes. You may answer anonymously — only the ratings are required.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-10 pb-16">
        {done ? (
          <div className="card-surface p-8 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-success" />
            <h2 className="mt-3 font-display text-xl">Feedback received</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Thank you for helping ESWA improve. Your responses feed directly into our impact
              reporting.
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
          <form
            className="card-surface space-y-7 p-6"
            onSubmit={(event) => {
              event.preventDefault();
              submit.mutate();
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="full_name">Name (optional)</Label>
                <Input
                  id="full_name"
                  maxLength={120}
                  value={form.full_name}
                  onChange={(e) => update("full_name", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email (optional)</Label>
                <Input
                  id="email"
                  type="email"
                  maxLength={255}
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="school">School or organisation</Label>
                <Input
                  id="school"
                  maxLength={160}
                  value={form.school}
                  onChange={(e) => update("school", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role_at_school">Your role</Label>
                <Input
                  id="role_at_school"
                  maxLength={120}
                  value={form.role_at_school}
                  onChange={(e) => update("role_at_school", e.target.value)}
                />
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
            </div>

            <Scale
              id="overall_rating"
              label="Overall, how would you rate your experience with ESWA? *"
              hint="1 = poor, 5 = excellent"
              max={5}
              value={form.overall_rating}
              onChange={(value) => update("overall_rating", value)}
            />
            <Scale
              id="stress_level"
              label="How stressed do you feel in your work at the moment?"
              hint="1 = very calm, 10 = completely overwhelmed"
              max={10}
              value={form.stress_level}
              onChange={(value) => update("stress_level", value)}
            />
            <Scale
              id="wellbeing_before"
              label="Your wellbeing BEFORE the workshop"
              hint="1 = very low, 10 = thriving"
              max={10}
              value={form.wellbeing_before}
              onChange={(value) => update("wellbeing_before", value)}
            />
            <Scale
              id="wellbeing_after"
              label="Your wellbeing AFTER the workshop"
              hint="1 = very low, 10 = thriving"
              max={10}
              value={form.wellbeing_after}
              onChange={(value) => update("wellbeing_after", value)}
            />

            <div className="space-y-2">
              <Label>Would you recommend ESWA to a colleague?</Label>
              <div className="flex gap-2">
                {[
                  { label: "Yes", value: true },
                  { label: "Not yet", value: false },
                ].map((option) => (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => update("would_recommend", option.value)}
                    className={`rounded-md border px-4 py-2 text-sm font-medium transition ${
                      form.would_recommend === option.value
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-input bg-background hover:bg-accent"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="most_valuable">What was most valuable for you?</Label>
              <Textarea
                id="most_valuable"
                maxLength={1000}
                value={form.most_valuable}
                onChange={(e) => update("most_valuable", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="improvements">What should ESWA improve?</Label>
              <Textarea
                id="improvements"
                maxLength={1000}
                value={form.improvements}
                onChange={(e) => update("improvements", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="future_topics">Which topics would help you most next?</Label>
              <Textarea
                id="future_topics"
                maxLength={1000}
                value={form.future_topics}
                onChange={(e) => update("future_topics", e.target.value)}
              />
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
