import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Clock, MapPin, Plus, Trash2, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { SiteLayout } from "@/components/site/site-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { programmes } from "@/lib/eswa-content";
import { friendlyError } from "@/lib/friendly-errors";
import { fetchRegistrationCounts, type Registration, type Workshop } from "@/lib/workshops";

export const Route = createFileRoute("/calendar")({
  head: () => ({
    meta: [
      { title: "Workshop calendar — ESWA" },
      {
        name: "description",
        content:
          "Month-by-month calendar of ESWA educator wellbeing workshops with dates, times, venues and live RSVP numbers.",
      },
      { property: "og:title", content: "Workshop calendar — ESWA" },
      {
        property: "og:description",
        content: "See every upcoming ESWA workshop on one calendar and reserve your seat.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CalendarPage,
});

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
const pad = (n: number) => String(n).padStart(2, "0");
function toLocalInput(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
const timeOf = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" });

function useIsAdmin() {
  const [uid, setUid] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUid(data.session?.user.id ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setUid(s?.user.id ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);
  const { data } = useQuery({
    queryKey: ["is-admin", uid],
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("has_role", { _user_id: uid!, _role: "admin" });
      if (error) throw error;
      return Boolean(data);
    },
  });
  return uid ? data === true : false;
}

type Draft = {
  id?: string;
  title: string;
  description: string;
  programme: string;
  facilitator: string;
  starts_at: string;
  duration_minutes: number;
  location: string;
  capacity: number;
  is_published: boolean;
  joining_details: string;
};

// Returns a plain-English problem, or null when the workshop details are fine.
function draftProblem(d: Draft): string | null {
  const title = d.title.trim();
  if (title.length < 3) return "Please give the workshop a title (at least 3 letters).";
  if (title.length > 150) return "Please keep the title under 150 characters.";
  if (!d.starts_at || Number.isNaN(new Date(d.starts_at).getTime())) {
    return "Please choose the date and start time.";
  }
  if (!d.id && new Date(d.starts_at).getTime() < Date.now()) {
    return "That date has already passed. Please choose a future date and time.";
  }
  if (
    !Number.isInteger(d.duration_minutes) ||
    d.duration_minutes < 15 ||
    d.duration_minutes > 720
  ) {
    return "Duration must be a whole number of minutes between 15 and 720.";
  }
  if (!Number.isInteger(d.capacity) || d.capacity < 1 || d.capacity > 1000) {
    return "Seats must be a whole number between 1 and 1000.";
  }
  if (!d.location.trim()) return "Please say where the workshop takes place (or 'Online').";
  if (d.location.length > 200) return "Please keep the location under 200 characters.";
  if (d.description.length > 2000) return "Please keep the description under 2000 characters.";
  if (d.joining_details.length > 1500)
    return "Please keep the joining details under 1500 characters.";
  return null;
}

function emptyDraft(date: Date): Draft {
  const d = new Date(date);
  d.setHours(15, 0, 0, 0);
  return {
    title: "",
    description: "",
    programme: programmes[1]?.title ?? "School Wellbeing Workshops",
    facilitator: "",
    starts_at: toLocalInput(d.toISOString()),
    duration_minutes: 90,
    location: "Online (Microsoft Teams)",
    capacity: 50,
    is_published: true,
    joining_details: "",
  };
}

function CalendarPage() {
  const isAdmin = useIsAdmin();
  const qc = useQueryClient();
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selected, setSelected] = useState<Workshop | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);

  const { data: workshops = [] } = useQuery({
    queryKey: ["calendar-workshops", isAdmin],
    queryFn: async () => {
      const { data, error } = await supabase.from("workshops").select("*").order("starts_at");
      if (error) throw error;
      return data as Workshop[];
    },
  });
  const { data: counts } = useQuery({
    queryKey: ["workshops", "counts"],
    queryFn: fetchRegistrationCounts,
  });

  // Live sync: refresh counts and RSVP lists when registrations change
  useEffect(() => {
    const id = setInterval(() => {
      qc.invalidateQueries({ queryKey: ["workshops", "counts"] });
      qc.invalidateQueries({ queryKey: ["rsvps"] });
    }, 20000);
    return () => clearInterval(id);
  }, [qc]);

  const byDay = useMemo(() => {
    const m = new Map<string, Workshop[]>();
    for (const w of workshops) {
      const k = dayKey(new Date(w.starts_at));
      m.set(k, [...(m.get(k) ?? []), w]);
    }
    return m;
  }, [workshops]);

  const cells = useMemo(() => {
    const start = new Date(month);
    const offset = (start.getDay() + 6) % 7;
    start.setDate(1 - offset);
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [month]);

  const monthEvents = workshops.filter((w) => {
    const d = new Date(w.starts_at);
    return d.getMonth() === month.getMonth() && d.getFullYear() === month.getFullYear();
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["calendar-workshops"] });
    qc.invalidateQueries({ queryKey: ["workshops"] });
    qc.invalidateQueries({ queryKey: ["staff-data"] });
  };

  const save = useMutation({
    mutationFn: async (d: Draft) => {
      const payload = {
        title: d.title.trim(),
        description: d.description.trim(),
        programme: d.programme.trim() || "School Wellbeing Workshops",
        facilitator: d.facilitator.trim() || null,
        starts_at: new Date(d.starts_at).toISOString(),
        duration_minutes: d.duration_minutes,
        location: d.location.trim(),
        capacity: d.capacity,
        is_published: d.is_published,
      };
      let workshopId = d.id;
      if (d.id) {
        const res = await supabase.from("workshops").update(payload).eq("id", d.id);
        if (res.error) throw res.error;
      } else {
        const res = await supabase.from("workshops").insert(payload).select("id").single();
        if (res.error) throw res.error;
        workshopId = res.data.id;
      }
      // Joining details are private: they go in their own table and are only
      // given to people who register.
      if (workshopId) {
        const details = d.joining_details.trim();
        const detailsResult = details
          ? await supabase
              .from("workshop_joining_details")
              .upsert({ workshop_id: workshopId, details, updated_at: new Date().toISOString() })
          : await supabase.from("workshop_joining_details").delete().eq("workshop_id", workshopId);
        if (detailsResult.error) throw detailsResult.error;
      }
    },
    onSuccess: () => {
      toast.success("Workshop saved");
      setDraft(null);
      refresh();
    },
    onError: (error) =>
      toast.error(friendlyError(error, "We couldn't save the workshop. Please try again.")),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("workshops").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Workshop removed");
      setSelected(null);
      refresh();
    },
    onError: (error) =>
      toast.error(friendlyError(error, "We couldn't remove the workshop. Please try again.")),
  });

  const today = dayKey(new Date());

  return (
    <SiteLayout>
      <section className="bg-hero-gradient">
        <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-4 px-4 py-10">
          <div>
            <h1 className="text-3xl sm:text-4xl">Workshop calendar</h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              {isAdmin
                ? "Plan upcoming events. Click a day to add a workshop, or an event to edit it and see who has RSVP'd."
                : "Every upcoming ESWA session at a glance. Click an event to see details and reserve your seat."}
            </p>
          </div>
          {isAdmin && (
            <Button onClick={() => setDraft(emptyDraft(new Date()))}>
              <Plus className="h-4 w-4" /> New workshop
            </Button>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Previous month"
            onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h2 className="font-display text-xl">
            {month.toLocaleDateString("en-ZA", { month: "long", year: "numeric" })}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Next month"
            onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        <div className="card-surface hidden overflow-hidden md:block">
          <div className="grid grid-cols-7 border-b border-border bg-secondary/50 text-center text-xs font-medium text-muted-foreground">
            {WEEKDAYS.map((d) => (
              <div key={d} className="py-2">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {cells.map((d) => {
              const inMonth = d.getMonth() === month.getMonth();
              const events = byDay.get(dayKey(d)) ?? [];
              return (
                <div
                  key={d.toISOString()}
                  onClick={() => isAdmin && setDraft(emptyDraft(d))}
                  className={`min-h-28 border-b border-r border-border p-1.5 text-xs ${inMonth ? "" : "bg-muted/40 text-muted-foreground"} ${isAdmin ? "cursor-pointer hover:bg-secondary/40" : ""}`}
                >
                  <div
                    className={`mb-1 inline-flex h-6 w-6 items-center justify-center rounded-full ${dayKey(d) === today ? "bg-primary text-primary-foreground" : ""}`}
                  >
                    {d.getDate()}
                  </div>
                  <div className="space-y-1">
                    {events.map((w) => (
                      <button
                        key={w.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelected(w);
                        }}
                        className={`block w-full truncate rounded-md px-1.5 py-1 text-left font-medium ${w.is_published ? "bg-primary/10 text-primary hover:bg-primary/20" : "border border-dashed border-border text-muted-foreground"}`}
                      >
                        {timeOf(w.starts_at)} {w.title}
                        <span className="ml-1 opacity-70">
                          · {counts?.get(w.id) ?? 0}/{w.capacity}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Agenda list (mobile + summary) */}
        <div className="space-y-3 md:mt-8">
          <h3 className="font-display text-lg md:text-base">This month</h3>
          {monthEvents.length === 0 && (
            <p className="text-sm text-muted-foreground">No workshops scheduled this month.</p>
          )}
          {monthEvents.map((w) => (
            <button
              key={w.id}
              onClick={() => setSelected(w)}
              className="card-surface flex w-full items-start gap-4 p-4 text-left"
            >
              <div className="w-12 shrink-0 text-center">
                <div className="text-xs uppercase text-muted-foreground">
                  {new Date(w.starts_at).toLocaleDateString("en-ZA", { month: "short" })}
                </div>
                <div className="font-display text-2xl text-primary">
                  {new Date(w.starts_at).getDate()}
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{w.title}</span>
                  {!w.is_published && <Badge variant="outline">Draft</Badge>}
                </div>
                <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {timeOf(w.starts_at)} · {w.duration_minutes} min
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {w.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {counts?.get(w.id) ?? 0} of {w.capacity} RSVPs
                  </span>
                </p>
              </div>
            </button>
          ))}
        </div>
      </section>

      <EventDialog
        workshop={selected}
        isAdmin={isAdmin}
        count={selected ? (counts?.get(selected.id) ?? 0) : 0}
        onClose={() => setSelected(null)}
        onEdit={(w) => {
          setSelected(null);
          setDraft({
            ...w,
            facilitator: w.facilitator ?? "",
            starts_at: toLocalInput(w.starts_at),
            joining_details: "",
          });
          // Load the private joining details (only admins are allowed to read them).
          void supabase
            .from("workshop_joining_details")
            .select("details")
            .eq("workshop_id", w.id)
            .maybeSingle()
            .then(({ data }) => {
              if (data?.details) {
                setDraft((current) =>
                  current && current.id === w.id
                    ? { ...current, joining_details: data.details }
                    : current,
                );
              }
            });
        }}
        onDelete={(id) => {
          const taken = counts?.get(id) ?? 0;
          const warning =
            taken > 0
              ? `Deleting this workshop will also permanently delete its ${taken} registration${taken === 1 ? "" : "s"}. If you only want to hide it, cancel and switch off "Visible to the public" instead.\n\nDelete it anyway?`
              : "Delete this workshop? This cannot be undone.";
          if (confirm(warning)) remove.mutate(id);
        }}
      />

      <Dialog open={!!draft} onOpenChange={(o) => !o && setDraft(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{draft?.id ? "Edit workshop" : "Plan a workshop"}</DialogTitle>
          </DialogHeader>
          {draft && (
            <form
              className="space-y-3"
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                const problem = draftProblem(draft);
                if (problem) {
                  toast.error(problem);
                  return;
                }
                save.mutate(draft);
              }}
            >
              <Field label="Title">
                <Input
                  value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                  required
                />
              </Field>
              <Field label="Programme">
                <Input
                  value={draft.programme}
                  onChange={(e) => setDraft({ ...draft, programme: e.target.value })}
                />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Date & start time">
                  <Input
                    type="datetime-local"
                    value={draft.starts_at}
                    onChange={(e) => setDraft({ ...draft, starts_at: e.target.value })}
                    required
                  />
                </Field>
                <Field label="Duration (minutes)">
                  <Input
                    type="number"
                    min={15}
                    value={draft.duration_minutes}
                    onChange={(e) =>
                      setDraft({ ...draft, duration_minutes: Number(e.target.value) })
                    }
                  />
                </Field>
              </div>
              <Field label="Location">
                <Input
                  value={draft.location}
                  onChange={(e) => setDraft({ ...draft, location: e.target.value })}
                />
              </Field>
              <Field label="Joining details (private, emailed to people who register)">
                <Textarea
                  rows={3}
                  placeholder="Teams link, venue address, parking, what to bring…"
                  value={draft.joining_details}
                  onChange={(e) => setDraft({ ...draft, joining_details: e.target.value })}
                />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Facilitator">
                  <Input
                    value={draft.facilitator}
                    onChange={(e) => setDraft({ ...draft, facilitator: e.target.value })}
                  />
                </Field>
                <Field label="Seats">
                  <Input
                    type="number"
                    min={1}
                    value={draft.capacity}
                    onChange={(e) => setDraft({ ...draft, capacity: Number(e.target.value) })}
                  />
                </Field>
              </div>
              <Field label="Description">
                <Textarea
                  rows={3}
                  value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                />
              </Field>
              <label className="flex items-center gap-3 text-sm">
                <Switch
                  checked={draft.is_published}
                  onCheckedChange={(v) => setDraft({ ...draft, is_published: v })}
                />
                Visible to the public (open for RSVPs)
              </label>
              <Button type="submit" className="w-full" disabled={save.isPending}>
                {save.isPending ? "Saving…" : "Save workshop"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </SiteLayout>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function EventDialog({
  workshop,
  isAdmin,
  count,
  onClose,
  onEdit,
  onDelete,
}: {
  workshop: Workshop | null;
  isAdmin: boolean;
  count: number;
  onClose: () => void;
  onEdit: (w: Workshop) => void;
  onDelete: (id: string) => void;
}) {
  const { data: rsvps = [] } = useQuery({
    queryKey: ["rsvps", workshop?.id],
    enabled: isAdmin && !!workshop,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("registrations")
        .select("*")
        .eq("workshop_id", workshop!.id)
        .order("created_at");
      if (error) throw error;
      return data as Registration[];
    },
  });

  return (
    <Dialog open={!!workshop} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        {workshop && (
          <>
            <DialogHeader>
              <DialogTitle>{workshop.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                {new Date(workshop.starts_at).toLocaleString("en-ZA", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                · {workshop.duration_minutes} min
              </p>
              <p className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                {workshop.location}
              </p>
              <p className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                {count} of {workshop.capacity} seats taken
              </p>
              {workshop.description && <p className="pt-2">{workshop.description}</p>}
            </div>

            {isAdmin && (
              <div className="mt-2">
                <h4 className="mb-2 font-display text-base">RSVP list ({rsvps.length})</h4>
                {rsvps.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No RSVPs yet.</p>
                ) : (
                  <ul className="divide-y divide-border rounded-lg border border-border text-sm">
                    {rsvps.map((r) => (
                      <li key={r.id} className="flex items-center justify-between gap-2 px-3 py-2">
                        <div className="min-w-0">
                          <div className="truncate font-medium">{r.full_name}</div>
                          <div className="truncate text-xs text-muted-foreground">
                            {r.email}
                            {r.school ? ` · ${r.school}` : ""}
                          </div>
                        </div>
                        {r.attended && <Badge variant="secondary">Attended</Badge>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              {workshop.is_published && new Date(workshop.starts_at) > new Date() && (
                <Button asChild>
                  <Link to="/workshops/$workshopId" params={{ workshopId: workshop.id }}>
                    RSVP
                  </Link>
                </Button>
              )}
              {isAdmin && (
                <>
                  <Button variant="secondary" onClick={() => onEdit(workshop)}>
                    Edit
                  </Button>
                  <Button variant="ghost" onClick={() => onDelete(workshop.id)}>
                    <Trash2 className="h-4 w-4" /> Delete
                  </Button>
                </>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
