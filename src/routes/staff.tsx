import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { Session } from "@supabase/supabase-js";
import { Download, LogOut, MessageSquareQuote, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { SiteLayout } from "@/components/site/site-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { friendlyError } from "@/lib/friendly-errors";
import { formatDateOnly, formatWorkshopDate } from "@/lib/workshops";

// Escape a value for inclusion in an XML spreadsheet document.
function xmlEscape(value: unknown): string {
  // Control characters are not allowed in XML and would corrupt the Excel file.
  const printable = Array.from(String(value ?? ""))
    .filter((ch) => {
      const code = ch.charCodeAt(0);
      return code === 9 || code === 10 || code === 13 || code >= 32;
    })
    .join("");
  return printable
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Build one <Worksheet> from an array of row objects (no external dependency).
function sheetXml(name: string, rows: Record<string, unknown>[]): string {
  const header = Object.keys(rows[0] ?? { Note: "No records" });
  const rowXml = (cells: unknown[]) =>
    `<Row>${cells
      .map(
        (cell) =>
          `<Cell><Data ss:Type="${typeof cell === "number" ? "Number" : "String"}">${xmlEscape(cell)}</Data></Cell>`,
      )
      .join("")}</Row>`;
  return `<Worksheet ss:Name="${xmlEscape(name)}"><Table>${rowXml(header)}${rows
    .map((row) => rowXml(header.map((key) => row[key])))
    .join("")}</Table></Worksheet>`;
}

export const Route = createFileRoute("/staff")({
  head: () => ({
    meta: [
      { title: "ESWA staff dashboard" },
      {
        name: "description",
        content:
          "ESWA team area: workshop attendance numbers, beneficiary records, feedback insights and Excel exports.",
      },
      { property: "og:title", content: "ESWA staff dashboard" },
      {
        property: "og:description",
        content: "Track beneficiaries, attendance and impact, and download the records as Excel.",
      },
    ],
  }),
  component: StaffPage,
});

function StaffPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!ready) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-md px-4 py-20 text-sm text-muted-foreground">Loading…</div>
      </SiteLayout>
    );
  }

  return <SiteLayout>{session ? <Dashboard /> : <SignIn />}</SiteLayout>;
}

function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!email.trim()) {
      toast.error("Please type your work email address.");
      return;
    }
    if (!password) {
      toast.error("Please type your password.");
      return;
    }
    setPending(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        toast.error(friendlyError(error, "We couldn't sign you in. Please try again."));
      }
    } catch (error) {
      toast.error(friendlyError(error, "We couldn't sign you in. Please try again."));
    }
    setPending(false);
  }

  async function forgotPassword() {
    if (!email.trim()) {
      toast.error("Type your work email above first, then click Forgot password.");
      return;
    }
    setPending(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        toast.error(friendlyError(error, "We couldn't send the reset email. Please try again."));
      } else {
        toast.success(
          "If that email has an account, a reset link is on its way. It can take a few minutes. Please check your spam folder too.",
        );
      }
    } catch (error) {
      toast.error(friendlyError(error, "We couldn't send the reset email. Please try again."));
    }
    setPending(false);
  }

  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <h1 className="font-display text-2xl">ESWA staff sign in</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        This area is for the ESWA team. Beneficiaries do not need an account.
      </p>
      <form onSubmit={submit} className="card-surface mt-6 space-y-4 p-6">
        <div className="space-y-2">
          <Label htmlFor="email">Work email</Label>
          <Input
            id="email"
            type="email"
            required
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <Button type="submit" className="w-full" disabled={pending}>
          Sign in
        </Button>
        <button
          type="button"
          className="w-full text-sm text-primary hover:underline"
          disabled={pending}
          onClick={() => void forgotPassword()}
        >
          Forgot password?
        </button>
      </form>
      <p className="mt-4 text-center text-xs text-muted-foreground">
        Staff accounts are created by the ESWA administrator. Need access? Ask the ESWA office.
      </p>
    </div>
  );
}

type Registration = Tables<"registrations">;
type Feedback = Tables<"feedback">;
type Workshop = Tables<"workshops">;

function Dashboard() {
  const queryClient = useQueryClient();

  const {
    data: isAdmin,
    isLoading: checkingRole,
    isError: roleCheckFailed,
    refetch: recheckRole,
  } = useQuery({
    queryKey: ["is-admin"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return false;
      const { data, error } = await supabase.rpc("has_role", {
        _user_id: userData.user.id,
        _role: "admin",
      });
      if (error) throw error;
      return Boolean(data);
    },
  });

  const {
    data,
    isError: dataFailed,
    refetch: reloadData,
  } = useQuery({
    queryKey: ["staff-data"],
    enabled: isAdmin === true,
    queryFn: async () => {
      const [workshops, registrations, feedback] = await Promise.all([
        supabase.from("workshops").select("*").order("starts_at", { ascending: false }),
        supabase.from("registrations").select("*").order("created_at", { ascending: false }),
        supabase.from("feedback").select("*").order("created_at", { ascending: false }),
      ]);
      if (workshops.error) throw workshops.error;
      if (registrations.error) throw registrations.error;
      if (feedback.error) throw feedback.error;
      return {
        workshops: workshops.data as Workshop[],
        registrations: registrations.data as Registration[],
        feedback: feedback.data as Feedback[],
      };
    },
  });

  const toggleAttended = useMutation({
    mutationFn: async ({ id, attended }: { id: string; attended: boolean }) => {
      const { error } = await supabase.from("registrations").update({ attended }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["staff-data"] }),
    onError: (error) =>
      toast.error(friendlyError(error, "We couldn't update attendance. Please try again.")),
  });

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
  }

  function exportExcel() {
    if (!data) return;
    const titleById = new Map(data.workshops.map((w) => [w.id, w.title]));

    const registrationRows = data.registrations.map((row) => ({
      Workshop: titleById.get(row.workshop_id) ?? row.workshop_id,
      "Full name": row.full_name,
      Email: row.email,
      Phone: row.phone ?? "",
      School: row.school ?? "",
      Role: row.role_at_school ?? "",
      Province: row.province ?? "",
      "Dietary / access needs": row.dietary_or_access_needs ?? "",
      Attended: row.attended ? "Yes" : "No",
      "Registered on": formatDateOnly(row.created_at),
    }));

    const attendanceRows = data.workshops.map((workshop) => {
      const registered = data.registrations.filter((r) => r.workshop_id === workshop.id);
      return {
        Workshop: workshop.title,
        Programme: workshop.programme,
        Date: formatWorkshopDate(workshop.starts_at),
        Location: workshop.location,
        Capacity: workshop.capacity,
        Registered: registered.length,
        Attended: registered.filter((r) => r.attended).length,
        "Seats left": Math.max(workshop.capacity - registered.length, 0),
      };
    });

    const feedbackRows = data.feedback.map((row) => ({
      Workshop: row.workshop_id ? (titleById.get(row.workshop_id) ?? "") : "General",
      Name: row.full_name ?? "Anonymous",
      Email: row.email ?? "",
      School: row.school ?? "",
      Role: row.role_at_school ?? "",
      "Overall rating": row.overall_rating,
      "Stress level": row.stress_level ?? "",
      "Wellbeing before": row.wellbeing_before ?? "",
      "Wellbeing after": row.wellbeing_after ?? "",
      Recommends: row.would_recommend === null ? "" : row.would_recommend ? "Yes" : "No",
      "Most valuable": row.most_valuable ?? "",
      Improvements: row.improvements ?? "",
      "Future topics": row.future_topics ?? "",
      Submitted: formatDateOnly(row.created_at),
    }));

    // SpreadsheetML 2003: opens directly in Excel/LibreOffice with three
    // sheets, without bundling the (CVE-affected) `xlsx` dependency.
    const workbookXml =
      `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<?mso-application progid="Excel.Sheet"?>\n` +
      `<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">` +
      sheetXml("Attendance", attendanceRows) +
      sheetXml("Registrations", registrationRows) +
      sheetXml("Feedback", feedbackRows) +
      `</Workbook>`;

    const blob = new Blob(["\uFEFF" + workbookXml], {
      type: "application/vnd.ms-excel",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `ESWA-records-${new Date().toISOString().slice(0, 10)}.xls`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success("Excel file downloaded.");
  }

  if (checkingRole) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-sm text-muted-foreground">
        Checking access…
      </div>
    );
  }

  if (roleCheckFailed) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center" role="alert">
        <h1 className="font-display text-xl">We couldn't check your access</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This is usually a weak internet connection. Please try again.
        </p>
        <Button className="mt-5" onClick={() => void recheckRole()}>
          Try again
        </Button>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="font-display text-xl">Access pending</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your account is not yet approved for the ESWA dashboard. Please ask the ESWA office to
          grant you access.
        </p>
        <Button className="mt-5" variant="outline" onClick={() => void signOut()}>
          Sign out
        </Button>
      </div>
    );
  }

  const registrations = data?.registrations ?? [];
  const feedback = data?.feedback ?? [];
  const uniqueBeneficiaries = new Set(registrations.map((r) => r.email)).size;
  const attendedCount = registrations.filter((r) => r.attended).length;
  const avgRating = feedback.length
    ? (feedback.reduce((sum, f) => sum + f.overall_rating, 0) / feedback.length).toFixed(1)
    : "—";
  const wellbeingLift = (() => {
    const rows = feedback.filter((f) => f.wellbeing_before != null && f.wellbeing_after != null);
    if (!rows.length) return "—";
    const delta =
      rows.reduce((sum, f) => sum + ((f.wellbeing_after ?? 0) - (f.wellbeing_before ?? 0)), 0) /
      rows.length;
    return `${delta > 0 ? "+" : ""}${delta.toFixed(1)}`;
  })();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl">ESWA dashboard</h1>
          <p className="text-sm text-muted-foreground">Beneficiaries, attendance and impact.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportExcel} disabled={!data}>
            <Download className="mr-2 h-4 w-4" /> Download Excel
          </Button>
          <Button variant="outline" onClick={() => void signOut()}>
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </Button>
        </div>
      </div>

      {dataFailed && (
        <div
          className="card-surface mt-6 flex flex-wrap items-center justify-between gap-3 p-4"
          role="alert"
        >
          <p className="text-sm">
            We couldn't load the latest records. The numbers below may be incomplete.
          </p>
          <Button size="sm" onClick={() => void reloadData()}>
            Try again
          </Button>
        </div>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Registrations", value: registrations.length, icon: Users },
          { label: "Unique beneficiaries", value: uniqueBeneficiaries, icon: Users },
          { label: "Marked attended", value: attendedCount, icon: Users },
          { label: "Average rating", value: avgRating, icon: MessageSquareQuote },
        ].map((stat) => (
          <div key={stat.label} className="card-surface p-5">
            <stat.icon className="h-5 w-5 text-primary" />
            <p className="mt-3 font-display text-2xl">{stat.value}</p>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      <p className="mt-4 text-sm text-muted-foreground">
        Average reported wellbeing change after a workshop: <strong>{wellbeingLift}</strong> points
        (out of 10), from {feedback.length} feedback responses.
      </p>

      <Tabs defaultValue="workshops" className="mt-8">
        <TabsList>
          <TabsTrigger value="workshops">Workshops</TabsTrigger>
          <TabsTrigger value="registrations">Beneficiaries</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
        </TabsList>

        <TabsContent value="workshops" className="space-y-3">
          {(data?.workshops ?? []).map((workshop) => {
            const rows = registrations.filter((r) => r.workshop_id === workshop.id);
            return (
              <div key={workshop.id} className="card-surface p-5">
                <h2 className="font-display text-lg">{workshop.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatWorkshopDate(workshop.starts_at)} · {workshop.location}
                </p>
                <p className="mt-2 text-sm">
                  <strong>{rows.length}</strong> registered of {workshop.capacity} ·{" "}
                  <strong>{rows.filter((r) => r.attended).length}</strong> attended
                </p>
              </div>
            );
          })}
        </TabsContent>

        <TabsContent value="registrations">
          <div className="card-surface overflow-x-auto p-2">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-muted-foreground">
                <tr>
                  <th className="p-3">Name</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">School</th>
                  <th className="p-3">Province</th>
                  <th className="p-3">Attended</th>
                </tr>
              </thead>
              <tbody>
                {registrations.map((row) => (
                  <tr key={row.id} className="border-t border-border">
                    <td className="p-3">{row.full_name}</td>
                    <td className="p-3">{row.email}</td>
                    <td className="p-3">{row.school ?? "—"}</td>
                    <td className="p-3">{row.province ?? "—"}</td>
                    <td className="p-3">
                      <button
                        type="button"
                        onClick={() =>
                          toggleAttended.mutate({ id: row.id, attended: !row.attended })
                        }
                        className={`rounded-md px-3 py-1 text-xs font-medium ${
                          row.attended
                            ? "bg-success text-success-foreground"
                            : "bg-secondary text-secondary-foreground"
                        }`}
                      >
                        {row.attended ? "Attended" : "Mark attended"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="feedback" className="space-y-3">
          {feedback.map((row) => (
            <article key={row.id} className="card-surface p-5">
              <p className="text-sm font-medium">
                {row.full_name ?? "Anonymous"} · rated {row.overall_rating}/5 ·{" "}
                {formatDateOnly(row.created_at)}
              </p>
              {row.most_valuable && (
                <p className="mt-2 text-sm text-muted-foreground">
                  <strong>Most valuable:</strong> {row.most_valuable}
                </p>
              )}
              {row.improvements && (
                <p className="mt-1 text-sm text-muted-foreground">
                  <strong>Improve:</strong> {row.improvements}
                </p>
              )}
              {row.future_topics && (
                <p className="mt-1 text-sm text-muted-foreground">
                  <strong>Future topics:</strong> {row.future_topics}
                </p>
              )}
            </article>
          ))}
          {feedback.length === 0 && (
            <p className="text-sm text-muted-foreground">No feedback submitted yet.</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
