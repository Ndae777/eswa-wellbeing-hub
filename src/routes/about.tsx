import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";

import { PageBanner, WideImage } from "@/components/site/site-images";
import { SiteLayout } from "@/components/site/site-layout";
import { Button } from "@/components/ui/button";
import { ESWA, outcomes, pillars, programmes, values } from "@/lib/eswa-content";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About ESWA — Educator Support and Wellness Alliance" },
      {
        name: "description",
        content:
          "ESWA is a South African non-profit improving the wellbeing, resilience and professional sustainability of educators.",
      },
      { property: "og:title", content: "About ESWA — Educator Support and Wellness Alliance" },
      {
        property: "og:description",
        content:
          "Our vision, mission, values, programmes and approach to educator wellbeing in South Africa.",
      },
    ],
  }),
  component: About,
});

function About() {
  return (
    <SiteLayout>
      <PageBanner slot="page-about">
        <div className="mx-auto max-w-4xl px-4 py-14">
          <h1 className="text-3xl sm:text-4xl">About ESWA</h1>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            {ESWA.name} is a South African non-profit organisation dedicated to improving the
            wellbeing, resilience and professional sustainability of educators.
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            ESWA was founded on the belief that healthy, supported and motivated teachers create
            thriving classrooms and improved learning outcomes. While much attention has gone to
            learner achievement, educator wellbeing has often received far less focus — despite its
            direct influence on teaching quality, staff retention, school climate and learner
            success.
          </p>
        </div>
      </PageBanner>

      <section className="mx-auto max-w-4xl px-4 pt-12">
        <WideImage slot="about-story" />
      </section>

      <section className="mx-auto max-w-4xl px-4 py-12">
        <div className="grid gap-4 sm:grid-cols-2">
          <article className="card-surface p-6">
            <h2 className="font-display text-xl">Our vision</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              To become South Africa's leading organisation advancing educator wellbeing and
              creating healthier, more resilient school communities where teachers are empowered to
              thrive and every learner benefits from quality teaching.
            </p>
          </article>
          <article className="card-surface p-6">
            <h2 className="font-display text-xl">Our mission</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              To improve educator wellbeing through innovative support programmes, professional
              development, research, advocacy and strategic partnerships that strengthen education
              systems and promote sustainable school improvement.
            </p>
          </article>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 pb-12">
        <h2 className="font-display text-2xl">Our values</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {values.map((value) => (
            <div key={value.title} className="rounded-xl bg-secondary/50 p-5">
              <h3 className="font-display text-lg">{value.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{value.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 pb-12">
        <h2 className="font-display text-2xl">Why educator wellbeing matters</h2>
        <p className="mt-3 text-sm text-muted-foreground">
          Educators face increasing demands: complex classrooms, curriculum reform, administration
          and the psychosocial challenges affecting learners. Without adequate support, prolonged
          occupational stress can lead to burnout, emotional exhaustion, absenteeism, lower morale
          and reduced teacher retention. Supporting educator wellbeing is an investment in learner
          achievement and in the future of South Africa's education system.
        </p>
      </section>

      <section className="mx-auto max-w-4xl px-4 pb-12">
        <h2 className="font-display text-2xl">Our programmes</h2>
        <div className="mt-6 space-y-4">
          {programmes.map((programme) => (
            <article key={programme.slug} className="card-surface p-6">
              <h3 className="font-display text-lg">{programme.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{programme.summary}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 pb-12">
        <h2 className="font-display text-2xl">Our approach</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {pillars.map((pillar) => (
            <div key={pillar.title} className="card-surface p-5">
              <h3 className="font-display text-lg">{pillar.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{pillar.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 pb-12">
        <h2 className="font-display text-2xl">Expected outcomes for partner schools</h2>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {outcomes.map((outcome) => (
            <li key={outcome} className="flex items-start gap-2 text-sm text-muted-foreground">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              {outcome}
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-4xl px-4 pb-12">
        <h2 className="font-display text-2xl">Founder</h2>
        <div className="card-surface mt-6 p-6">
          <h3 className="font-display text-lg">{ESWA.founder}</h3>
          <p className="text-sm text-primary">Founder and Executive Director</p>
          <p className="mt-3 text-sm text-muted-foreground">
            Sesethu Zongwana is an experienced South African educator and public management
            practitioner committed to strengthening education through educator wellbeing, public
            sector leadership and evidence-based policy. Drawing on extensive classroom experience
            and advanced studies in public management, she established ESWA to address the growing
            need for structured support systems that promote educator resilience and professional
            wellbeing.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 pb-16">
        <div className="card-surface flex flex-col gap-4 bg-secondary/60 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-xl">Partner with ESWA</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Email {ESWA.email} or call {ESWA.phone} to bring a programme to your school.
            </p>
          </div>
          <Button asChild>
            <Link to="/workshops">See workshops</Link>
          </Button>
        </div>
      </section>
    </SiteLayout>
  );
}
