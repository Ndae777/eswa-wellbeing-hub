import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, CheckCircle2, Clock, MapPin, User, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { SiteLayout } from "@/components/site/site-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchRegistrationCounts,
  fetchWorkshop,
  formatWorkshopDate,
  provinces,
} from "@/lib/workshops";

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

function WorkshopDetail() {
  const { workshopId } = Route.useParams();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [done, setDone] = useState(false);

  const { data: workshop, isLoading } = useQuery({
    queryKey: ["workshop", workshopId],
    queryFn: () => fetchWorkshop(workshopId),
  });
  const { data: counts } = useQuery({
    queryKey: ["workshops", "counts"],
    queryFn: fetchRegistrationCounts,
  });

  const registered = counts?.get(workshopId) ?? 0;
  const seatsLeft = workshop ? Math.max(workshop.capacity - registered, 0) : 0;

  const register = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("registrations").insert({
        workshop_id: workshopId,
        full_name: form.full_name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim() || null,
        school: form.school.trim() || null,
        role_at_school: form.role_at_school.trim() || null,
        province: form.province || null,
        dietary_or_access_needs: form.dietary_or_access_needs.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setDone(true);
      setForm(emptyForm);
      queryClient.invalidateQueries({ queryKey: ["workshops", "counts"] });
      toast.success("Your seat is reserved. ESWA will email you the details.");
    },
    onError: (error: { message?: string; code?: string }) => {
      if (error.code === "23505" || error.message?.includes("duplicate")) {
        toast.error("This email is already registered for this workshop.");
        return;
      }
      const message = error.message ?? "";
      if (message.includes("workshop_full")) {
        toast.error("Sorry, this workshop has just filled up.");
        queryClient.invalidateQueries({ queryKey: ["workshops", "counts"] });
        return;
      }
      if (message.includes("invalid_email")) {
        toast.error("Please enter a valid email address.");
        return;
      }
      if (message.includes("workshop_unavailable")) {
        toast.error("This workshop is no longer open for registration.");
        return;
      }
      toast.error("We could not save your registration. Please try again.");
    },
  });

  function update<K extends keyof FormState>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  if (isLoading) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-3xl px-4 py-16 text-sm text-muted-foreground">Loading…</div>
      </SiteLayout>
    );
  }

  if (!workshop) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-3xl px-4 py-16 text-center">
          <h1 className="font-display text-2xl">Workshop not found</h1>
          <Button asChild className="mt-4">
            <Link to="/workshops">Back to workshops</Link>
          </Button>
        </div>
      </SiteLayout>
    );
  }

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
          {done ? (
            <div className="text-center">
              <CheckCircle2 className="mx-auto h-10 w-10 text-success" />
              <h2 className="mt-3 font-display text-xl">You're on the list</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                ESWA has your details and will confirm the venue and joining information by email.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <Button asChild variant="secondary">
                  <Link to="/workshops">Other workshops</Link>
                </Button>
                <Button asChild>
                  <Link to="/feedback">Share feedback</Link>
                </Button>
              </div>
            </div>
          ) : (
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                if (!form.full_name.trim() || !form.email.trim()) {
                  toast.error("Please add your name and email.");
                  return;
                }
                register.mutate();
              }}
            >
              <div>
                <h2 className="font-display text-xl">Reserve your seat</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  No account needed. We only use these details to run the workshop and report on
                  impact.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full name *</Label>
                  <Input
                    id="full_name"
                    required
                    maxLength={120}
                    value={form.full_name}
                    onChange={(e) => update("full_name", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    maxLength={255}
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    maxLength={30}
                    value={form.phone}
                    onChange={(e) => update("phone", e.target.value)}
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
                    placeholder="Teacher, HOD, principal…"
                    maxLength={120}
                    value={form.role_at_school}
                    onChange={(e) => update("role_at_school", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="province">Province</Label>
                  <select
                    id="province"
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
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
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="needs">Dietary or accessibility needs</Label>
                <Textarea
                  id="needs"
                  maxLength={500}
                  value={form.dietary_or_access_needs}
                  onChange={(e) => update("dietary_or_access_needs", e.target.value)}
                />
              </div>

              <Button type="submit" size="lg" disabled={register.isPending}>
                {register.isPending ? "Reserving…" : "Confirm my RSVP"}
              </Button>
            </form>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}
