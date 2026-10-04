import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CalendarDays,
  HeartPulse,
  MessageCircleHeart,
  Phone,
  Sparkle,
  Users,
} from "lucide-react";

import { SiteLayout } from "@/components/site/site-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ESWA, outcomes, pillars, programmes } from "@/lib/eswa-content";
import { fetchUpcomingWorkshops, formatWorkshopDate } from "@/lib/workshops";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ESWA — Wellness for Teachers. Success for Learners." },
      {
        name: "description",
        content:
          "ESWA supports South African educators with wellness programmes, workshop registration, mental health resources and a wellness chat helper.",
      },
      { property: "og:title", content: "ESWA — Wellness for Teachers. Success for Learners." },
      {
        property: "og:description",
        content:
          "Register for educator wellbeing workshops, find South African mental health support and get practical wellness tips.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const { data: workshops } = useQuery({
    queryKey: ["workshops", "upcoming", 3],
    queryFn: () => fetchUpcomingWorkshops(3),
  });

  return (
    <SiteLayout>
      <section className="bg-hero-gradient">
        <div className="mx-auto max-w-6xl px-4 pb-16 pt-12 sm:pt-20">
          <Badge className="bg-card text-primary shadow-soft hover:bg-card">
            <Sparkle className="mr-1 h-3 w-3" /> A South African non-profit for educators
          </Badge>
          <p className="mt-6 text-sm font-medium uppercase tracking-widest text-primary/80">
            Welcome to
          </p>
          <h1 className="mt-2 max-w-2xl text-4xl leading-tight text-foreground sm:text-5xl md:text-6xl">
            Wellness for Teachers. Success for Learners.
          </h1>
          <p className="mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
            {ESWA.name} helps educators and school leaders protect their wellbeing, so classrooms
            stay places where both teachers and learners can thrive.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/workshops">
                Register for a workshop <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="bg-card">
              <Link to="/resources">Get support now</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              to: "/workshops" as const,
              icon: CalendarDays,
              title: "Workshops",
              text: "See upcoming sessions and register in under a minute.",
            },
            {
              to: "/chat" as const,
              icon: MessageCircleHeart,
              title: "Wellness chat",
              text: "Ask for mental health tips and short activities you can do today.",
            },
            {
              to: "/resources" as const,
              icon: HeartPulse,
              title: "Mental health support",
              text: "South African helplines, crisis numbers and ESWA self-help guides.",
            },
          ].map((card) => (
            <Link
              key={card.to}
              to={card.to}
              className="card-surface group p-6 transition hover:shadow-lift"
            >
              <card.icon className="h-7 w-7 text-primary" />
              <h2 className="mt-4 font-display text-lg">{card.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{card.text}</p>
              <span className="mt-4 inline-flex items-center text-sm font-medium text-primary">
                Open <ArrowRight className="ml-1 h-4 w-4 transition group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-display text-2xl sm:text-3xl">Featured programmes</h2>
          <Link to="/about" className="text-sm font-medium text-primary hover:underline">
            About ESWA
          </Link>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {programmes.map((programme) => (
            <article key={programme.slug} className="card-surface p-6">
              <h3 className="font-display text-lg leading-snug">{programme.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{programme.summary}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-display text-2xl sm:text-3xl">Next workshops</h2>
          <Link to="/workshops" className="text-sm font-medium text-primary hover:underline">
            View all
          </Link>
        </div>
        <div className="mt-6 space-y-4">
          {(workshops ?? []).map((workshop) => (
            <article
              key={workshop.id}
              className="card-surface flex flex-col gap-4 p-6 sm:flex-row sm:items-center"
            >
              <div className="flex-1">
                <p className="text-xs font-medium uppercase tracking-wide text-primary">
                  {workshop.programme}
                </p>
                <h3 className="mt-1 font-display text-lg">{workshop.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatWorkshopDate(workshop.starts_at)} · {workshop.location}
                </p>
              </div>
              <Button asChild variant="secondary">
                <Link to="/workshops/$workshopId" params={{ workshopId: workshop.id }}>
                  Register now
                </Link>
              </Button>
            </article>
          ))}
          {workshops?.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No dates are open right now — please check back soon.
            </p>
          )}
        </div>
      </section>

      <section className="bg-deep-gradient">
        <div className="mx-auto max-w-6xl px-4 py-14 text-primary-foreground">
          <h2 className="font-display text-2xl sm:text-3xl">Our approach</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {pillars.map((pillar) => (
              <div key={pillar.title}>
                <h3 className="font-display text-lg">{pillar.title}</h3>
                <p className="mt-2 text-sm opacity-90">{pillar.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="font-display text-2xl sm:text-3xl">What partner schools can expect</h2>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {outcomes.map((outcome) => (
            <li key={outcome} className="flex items-start gap-3 text-sm">
              <Users className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span className="text-muted-foreground">{outcome}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="card-surface flex flex-col gap-4 bg-secondary/60 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-xl">Tell us how we can improve</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Our short questionnaire takes about three minutes and shapes our next programmes.
            </p>
          </div>
          <Button asChild>
            <Link to="/feedback">Give feedback</Link>
          </Button>
        </div>
        <p className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
          <Phone className="h-4 w-4 text-destructive" />
          In crisis? Call SADAG 0800 456 789 or Lifeline SA 0861 322 322, any time.
        </p>
      </section>
    </SiteLayout>
  );
}
