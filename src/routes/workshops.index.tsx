import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, Clock, MapPin, Users } from "lucide-react";

import { PageBanner, ThumbImage, programmeSlot } from "@/components/site/site-images";
import { SiteLayout } from "@/components/site/site-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  fetchRegistrationCounts,
  fetchUpcomingWorkshops,
  formatWorkshopDate,
} from "@/lib/workshops";

export const Route = createFileRoute("/workshops/")({
  head: () => ({
    meta: [
      { title: "Upcoming workshops — ESWA" },
      {
        name: "description",
        content:
          "Browse upcoming ESWA educator wellbeing workshops and register for a seat. Free registration for South African teachers and school leaders.",
      },
      { property: "og:title", content: "Upcoming workshops — ESWA" },
      {
        property: "og:description",
        content: "Burnout prevention, resilience, leadership wellbeing and peer support sessions.",
      },
    ],
  }),
  component: Workshops,
});

function Workshops() {
  const {
    data: workshops,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["workshops", "upcoming"],
    queryFn: () => fetchUpcomingWorkshops(),
  });
  const { data: counts } = useQuery({
    queryKey: ["workshops", "counts"],
    queryFn: fetchRegistrationCounts,
  });

  return (
    <SiteLayout>
      <PageBanner slot="page-workshops">
        <div className="mx-auto max-w-5xl px-4 py-12">
          <h1 className="text-3xl sm:text-4xl">Workshops</h1>
          <p className="mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
            Interactive, evidence-informed sessions for educators and school management teams.
            Registration is free and takes under a minute. No account is needed.
          </p>
        </div>
      </PageBanner>

      <section className="mx-auto max-w-5xl px-4 py-10">
        {isLoading && (
          <div className="space-y-4">
            <Skeleton className="h-40 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
          </div>
        )}

        {isError && (
          <div className="card-surface p-8 text-center" role="alert">
            <h2 className="font-display text-lg">We couldn't load the workshops</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              This is usually a weak internet connection. Your details are safe. Please try again.
            </p>
            <Button className="mt-4" onClick={() => void refetch()}>
              Try again
            </Button>
          </div>
        )}

        <div className="space-y-4">
          {(workshops ?? []).map((workshop) => {
            const taken = counts?.get(workshop.id) ?? 0;
            const left = Math.max(workshop.capacity - taken, 0);
            return (
              <article key={workshop.id} className="card-surface flex gap-5 p-6">
                <ThumbImage slot={programmeSlot(workshop.programme)} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{workshop.programme}</Badge>
                    {left === 0 ? (
                      <Badge variant="destructive">Full</Badge>
                    ) : (
                      <Badge className="bg-success text-success-foreground hover:bg-success">
                        {left} seat{left === 1 ? "" : "s"} left
                      </Badge>
                    )}
                  </div>
                  <h2 className="mt-3 font-display text-xl">{workshop.title}</h2>
                  <div className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                    <p className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-primary" />
                      {formatWorkshopDate(workshop.starts_at)}
                    </p>
                    <p className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      {workshop.duration_minutes} minutes
                    </p>
                    <p className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      {workshop.location}
                    </p>
                    <p className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      {taken} registered of {workshop.capacity}
                    </p>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">{workshop.description}</p>
                  <div className="mt-5">
                    <Button asChild variant={left === 0 ? "outline" : "default"}>
                      <Link to="/workshops/$workshopId" params={{ workshopId: workshop.id }}>
                        {left === 0 ? "View details" : "Register now"}
                      </Link>
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {workshops?.length === 0 && (
          <div className="card-surface p-8 text-center">
            <h2 className="font-display text-lg">No open dates right now</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              New sessions are added regularly. Meanwhile, explore our self-help guides and support
              lines.
            </p>
            <Button asChild variant="secondary" className="mt-4">
              <Link to="/resources">Mental health resources</Link>
            </Button>
          </div>
        )}
      </section>
    </SiteLayout>
  );
}
