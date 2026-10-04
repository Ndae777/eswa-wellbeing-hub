import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, Phone } from "lucide-react";

import { PageBanner } from "@/components/site/site-images";
import { SiteLayout } from "@/components/site/site-layout";
import { Button } from "@/components/ui/button";
import { helplines, selfHelpGuides, warningSigns } from "@/lib/eswa-content";

export const Route = createFileRoute("/resources")({
  head: () => ({
    meta: [
      { title: "Mental health resources — ESWA" },
      {
        name: "description",
        content:
          "South African mental health helplines including SADAG and Lifeline SA, crisis numbers, burnout warning signs and ESWA self-help guides for educators.",
      },
      { property: "og:title", content: "Mental health resources — ESWA" },
      {
        property: "og:description",
        content: "24/7 crisis numbers, support organisations and practical self-help guides.",
      },
    ],
  }),
  component: Resources,
});

function Resources() {
  return (
    <SiteLayout>
      <PageBanner slot="page-resources">
        <div className="mx-auto max-w-4xl px-4 py-12">
          <h1 className="text-3xl sm:text-4xl">Mental Health Resources</h1>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            If you are in danger or thinking about harming yourself, please reach out now. These
            South African services are free and confidential.
          </p>
        </div>
      </PageBanner>

      <section className="mx-auto max-w-4xl px-4 py-10">
        <h2 className="font-display text-2xl">Helplines and organisations</h2>
        <div className="mt-6 space-y-3">
          {helplines.map((line) => (
            <article
              key={line.name}
              className={`rounded-xl border-l-4 bg-card p-5 shadow-soft ${
                line.urgent ? "border-destructive" : "border-primary"
              }`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-display text-lg">{line.name}</h3>
                {line.urgent && (
                  <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                    24/7 crisis
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{line.detail}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {line.numbers.map((number) => (
                  <a
                    key={number.value}
                    href={`tel:${number.value.replace(/\s/g, "")}`}
                    className="inline-flex items-center gap-2 rounded-md bg-secondary px-3 py-1.5 text-sm font-medium text-secondary-foreground"
                  >
                    <Phone className="h-3.5 w-3.5" /> {number.label}: {number.value}
                  </a>
                ))}
              </div>
              {line.website && (
                <a
                  href={line.website}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
                >
                  Visit website
                </a>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 pb-10">
        <h2 className="font-display text-2xl">ESWA self-help guides</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Short practices designed for a teacher's day — most take five minutes or less.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {selfHelpGuides.map((guide) => (
            <article key={guide.title} className="card-surface p-5">
              <h3 className="font-display text-lg">{guide.title}</h3>
              <p className="mt-1 text-xs font-medium uppercase tracking-wide text-primary">
                About {guide.minutes} minutes
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{guide.summary}</p>
              <ol className="mt-3 space-y-2 text-sm text-muted-foreground">
                {guide.steps.map((step, index) => (
                  <li key={step} className="flex gap-2">
                    <span className="font-medium text-primary">{index + 1}.</span>
                    {step}
                  </li>
                ))}
              </ol>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 pb-10">
        <div className="card-surface p-6">
          <h2 className="flex items-center gap-2 font-display text-xl">
            <AlertTriangle className="h-5 w-5 text-warning" /> Burnout warning signs
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            If several of these have lasted more than two weeks, please speak to a professional or
            call one of the lines above.
          </p>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {warningSigns.map((sign) => (
              <li key={sign} className="text-sm text-muted-foreground">
                • {sign}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 pb-16">
        <div className="card-surface flex flex-col gap-4 bg-secondary/60 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-xl">Want tips right now?</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Our wellness chat helper suggests activities for stress, sleep and focus.
            </p>
          </div>
          <Button asChild>
            <Link to="/chat">Open wellness chat</Link>
          </Button>
        </div>
      </section>
    </SiteLayout>
  );
}
