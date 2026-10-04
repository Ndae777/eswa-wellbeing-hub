import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, Grid2X2, Maximize2, Minimize2, Printer, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EswaLogo } from "@/components/site/eswa-logo";
import classroom from "@/assets/eswa-classroom.jpg";
import home from "@/assets/eswa-home-crop.jpg";
import workshops from "@/assets/eswa-workshops-crop.jpg";
import calendar from "@/assets/eswa-calendar-crop.jpg";
import resources from "@/assets/eswa-resources-crop.jpg";

export const Route = createFileRoute("/presentation")({
  // Hidden from the public unless VITE_SHOW_PRESENTATION is set to "true".
  beforeLoad: () => {
    if (import.meta.env["VITE_SHOW_PRESENTATION"] !== "true") {
      throw redirect({ to: "/" });
    }
  },
  head: () => ({
    meta: [
      { name: "robots", content: "noindex" },
      { title: "ESWA pilot presentation — Educator wellbeing, made actionable" },
      {
        name: "description",
        content:
          "A judges' presentation on ESWA's educator wellbeing challenge, pilot website solution, delivery and impact measurement.",
      },
      {
        property: "og:title",
        content: "ESWA pilot presentation — Educator wellbeing, made actionable",
      },
      {
        property: "og:description",
        content:
          "The challenge, working website, pilot measurement plan and handover for the Educator Support and Wellness Alliance.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Presentation,
});

const LIVE = import.meta.env["VITE_PUBLIC_APP_URL"] || "http://localhost:3000";
const headings = [
  "ESWA",
  "The problem",
  "Why it matters",
  "Our pilot",
  "The solution",
  "Beneficiary journey",
  "A working website",
  "ESWA operations",
  "Measuring impact",
  "Responsible support",
  "Pilot roadmap",
  "What success looks like",
  "The handover",
];
const notes = [
  "Introduce ESWA as a new South African NPO. The website is a pilot tool, not a claim that outcomes have already been achieved.",
  "Ground the need in ESWA's own organisational profile. Avoid quoting national prevalence figures we have not independently verified.",
  "Explain the chain from educator wellbeing to classroom climate and learner experience; do not claim the website alone causes better learner results.",
  "State that the pilot tests reach, attendance and usefulness before expansion. No adoption or outcome statistics are being claimed here.",
  "Walk judges through what is already built versus what ESWA will learn in the pilot.",
  "Show how an educator discovers a workshop, reserves a place and gives feedback, without needing an account.",
  "Open the live website if connectivity permits. Screenshots on this slide are from the actual site.",
  "Staff can plan workshops, manage RSVP and attendance lists and download an Excel workbook. Staff access is restricted.",
  "Explain that registration counts show reach, checked-in attendance shows participation, and feedback shows perceived value. Only report aggregated results with context.",
  "The chat gives general tips, not diagnosis or therapy. Show the local helplines and handoff to human support in a crisis.",
  "These are proposed pilot stages, not completed milestones. ESWA should agree the schools, period and targets before launch.",
  "The measures are definitions, not promises. No baseline or targets have been invented.",
  "End by asking ESWA to confirm the pilot partner schools, owner, calendar and safeguarding process. Point judges to the live site.",
];

function Kicker({ children }: { children: ReactNode }) {
  return <div className="slide-kicker text-primary">{children}</div>;
}
function SlideFrame({
  children,
  number,
  dark = false,
  className = "",
}: {
  children: ReactNode;
  number: number;
  dark?: boolean;
  className?: string;
}) {
  return (
    <div className={`slide-content ${dark ? "slide-dark" : ""} ${className}`}>
      <div className="slide-inner">{children}</div>
      <div className="slide-footer">
        <span>
          ESWA <span className="slide-footer-sep">/</span> PILOT PRESENTATION
        </span>
        <span>
          {String(number + 1).padStart(2, "0")} <span className="slide-footer-sep">/</span>{" "}
          {String(headings.length).padStart(2, "0")}
        </span>
      </div>
    </div>
  );
}
function Heading({ eyebrow, title, intro }: { eyebrow: string; title: string; intro?: string }) {
  return (
    <div className="slide-heading">
      <Kicker>{eyebrow}</Kicker>
      <h2 className="slide-title">{title}</h2>
      {intro && <p className="slide-body slide-muted slide-intro">{intro}</p>}
    </div>
  );
}
function NumberBlock({ number, label, detail }: { number: string; label: string; detail: string }) {
  return (
    <div className="slide-number-block">
      <span className="slide-stat">{number}</span>
      <h3 className="slide-subtitle">{label}</h3>
      <p className="slide-body slide-muted">{detail}</p>
    </div>
  );
}
function Slides({ index }: { index: number }) {
  switch (index) {
    case 0:
      return (
        <SlideFrame number={index} dark className="slide-cover">
          <img
            className="slide-cover-image"
            src={classroom}
            alt="South African educators speaking together in a staffroom"
          />
          <div className="slide-cover-shade" />
          <div className="slide-cover-copy">
            <div className="slide-cover-brand">
              <EswaLogo /> ESWA <span>— Educator Support and Wellness Alliance</span>
            </div>
            <p className="slide-kicker">PILOT PROJECT · SOUTH AFRICA</p>
            <h1 className="slide-title-lg">
              Wellness for Teachers.
              <br />
              <em>Success for Learners.</em>
            </h1>
            <p className="slide-body-lg">
              A practical digital home for educator wellbeing, workshop participation and
              evidence-led learning.
            </p>
          </div>
        </SlideFrame>
      );
    case 1:
      return (
        <SlideFrame number={index}>
          <Heading
            eyebrow="01 / THE CHALLENGE"
            title="Teachers are asked to carry more. Support has not kept pace."
            intro="ESWA's organisational profile identifies a persistent gap: educator wellbeing receives less attention than learner achievement, even though the two are connected."
          />
          <div className="slide-three">
            <NumberBlock
              number="01"
              label="Rising pressure"
              detail="Complex classrooms, administrative demands and learners' psychosocial needs."
            />
            <NumberBlock
              number="02"
              label="Too little support"
              detail="Prolonged occupational stress can contribute to exhaustion, absenteeism and low morale."
            />
            <NumberBlock
              number="03"
              label="Hard to see impact"
              detail="A new organisation needs a reliable way to track participation and hear directly from educators."
            />
          </div>
          <p className="slide-source">
            Source: ESWA organisational profile, “Why educator wellbeing matters”.
          </p>
        </SlideFrame>
      );
    case 2:
      return (
        <SlideFrame number={index} dark className="slide-deep">
          <Kicker>02 / THE CASE FOR ACTION</Kicker>
          <h2 className="slide-title-lg slide-big-statement">
            When teachers are supported, <em>whole school communities</em> stand to benefit.
          </h2>
          <div className="slide-chain">
            <div>
              <strong>Educator</strong>
              <span>Wellbeing & resilience</span>
            </div>
            <b>→</b>
            <div>
              <strong>School</strong>
              <span>Morale & collaboration</span>
            </div>
            <b>→</b>
            <div>
              <strong>Learner</strong>
              <span>A healthier learning environment</span>
            </div>
          </div>
          <p className="slide-caption">
            This is ESWA's theory of change — an intended pathway, not a measured pilot outcome.
          </p>
        </SlideFrame>
      );
    case 3:
      return (
        <SlideFrame number={index}>
          <Heading
            eyebrow="03 / WHO WE ARE"
            title="A new NPO, starting with a focused pilot."
            intro="Founded by Ms. Sesethu Zongwana, ESWA works to strengthen educator wellbeing through support, training, research and advocacy."
          />
          <div className="slide-split">
            <div className="slide-emphasis">
              <span className="slide-kicker">THE PILOT QUESTION</span>
              <p className="slide-subtitle">
                Can one accessible place help educators find support, join sessions, and give ESWA
                the evidence to improve?
              </p>
            </div>
            <div className="slide-list">
              <p>
                <strong>Who</strong>
                <span>Educators and school leaders in South Africa</span>
              </p>
              <p>
                <strong>Where</strong>
                <span>Partner schools selected by ESWA</span>
              </p>
              <p>
                <strong>What to learn</strong>
                <span>Reach, attendance, usefulness and areas for improvement</span>
              </p>
            </div>
          </div>
          <p className="slide-source">
            Pilot schools, dates and targets are to be confirmed by ESWA.
          </p>
        </SlideFrame>
      );
    case 4:
      return (
        <SlideFrame number={index}>
          <Heading
            eyebrow="04 / THE SOLUTION"
            title="One place. Two connected sides."
            intro="The website serves educators directly while giving ESWA the tools to coordinate and learn from its pilot."
          />
          <div className="slide-two">
            <div className="slide-panel slide-panel-tint">
              <span className="slide-kicker">FOR EDUCATORS</span>
              <h3 className="slide-subtitle">Access support</h3>
              <ul className="slide-body">
                <li>Discover ESWA and its programmes</li>
                <li>Browse dates and RSVP for workshops</li>
                <li>Use practical guides and SA helplines</li>
                <li>Share feedback and wellbeing reflections</li>
                <li>Ask the wellness chat for general tips</li>
              </ul>
            </div>
            <div className="slide-panel slide-panel-dark">
              <span className="slide-kicker">FOR ESWA</span>
              <h3 className="slide-subtitle">Run the pilot</h3>
              <ul className="slide-body">
                <li>Plan and publish workshop dates</li>
                <li>See RSVP totals and attendee lists</li>
                <li>Mark actual attendance</li>
                <li>Review questionnaire responses</li>
                <li>Download Excel records for reporting</li>
              </ul>
            </div>
          </div>
        </SlideFrame>
      );
    case 5:
      return (
        <SlideFrame number={index}>
          <Heading
            eyebrow="05 / THE BENEFICIARY JOURNEY"
            title="From interest to insight — without an account."
          />
          <div className="slide-journey">
            {[
              ["01", "Discover", "Learn who ESWA is and find an upcoming session."],
              ["02", "Reserve", "RSVP with contact details; see available places."],
              ["03", "Participate", "Attend a workshop and access follow-up support."],
              ["04", "Reflect", "Complete the questionnaire so ESWA can improve."],
            ].map(([n, t, d]) => (
              <div key={n}>
                <span>{n}</span>
                <h3 className="slide-subtitle">{t}</h3>
                <p className="slide-body slide-muted">{d}</p>
              </div>
            ))}
          </div>
          <div className="slide-bottom-callout">
            Low-friction access for beneficiaries. A connected record for ESWA.
          </div>
        </SlideFrame>
      );
    case 6:
      return (
        <SlideFrame number={index}>
          <Heading
            eyebrow="06 / WORKING PRODUCT"
            title="The solution is already live."
            intro="These are real screens from the ESWA website — not proposed mockups."
          />
          <div className="slide-screens">
            <div>
              <img src={home} alt="ESWA website home page" />
              <span>01 · Learn about ESWA</span>
            </div>
            <div>
              <img src={workshops} alt="ESWA workshop registration page" />
              <span>02 · Find & RSVP</span>
            </div>
            <div>
              <img src={calendar} alt="ESWA workshop calendar" />
              <span>03 · Plan & browse dates</span>
            </div>
            <div>
              <img src={resources} alt="ESWA mental health resources page" />
              <span>04 · Get support</span>
            </div>
          </div>
          <p className="slide-source">Live demonstration: {LIVE}</p>
        </SlideFrame>
      );
    case 7:
      return (
        <SlideFrame number={index}>
          <Heading
            eyebrow="07 / OPERATIONS & HANDOVER"
            title="Built for the team running the work."
          />
          <div className="slide-operations">
            <div className="slide-operation-main">
              <span className="slide-kicker">ONE CONNECTED WORKFLOW</span>
              <h3 className="slide-subtitle">Schedule → RSVP → attend → learn</h3>
              <p className="slide-body">
                An event created in the calendar appears for registration when published. RSVP
                counts and lists follow the same workshop into the staff area.
              </p>
            </div>
            <div className="slide-operation-items">
              <p>
                <strong>Plan</strong>
                <span>Dates, times, locations, facilitators and capacity</span>
              </p>
              <p>
                <strong>Track</strong>
                <span>Registrations, attendance and beneficiary responses</span>
              </p>
              <p>
                <strong>Keep</strong>
                <span>Export Attendance, Registrations and Feedback to Excel</span>
              </p>
            </div>
          </div>
          <p className="slide-source">
            Staff access is restricted; beneficiaries do not need an account to RSVP.
          </p>
        </SlideFrame>
      );
    case 8:
      return (
        <SlideFrame number={index}>
          <Heading
            eyebrow="08 / PILOT EVALUATION"
            title="Measure what happens — not what we hope happened."
            intro="The website creates a practical evidence trail. ESWA can use it to refine the programme during the pilot."
          />
          <div className="slide-metrics">
            <NumberBlock
              number="01"
              label="Reach"
              detail="Unique workshop registrants and sign-ups by session."
            />
            <NumberBlock
              number="02"
              label="Participation"
              detail="Attendance marked by staff, compared with RSVPs."
            />
            <NumberBlock
              number="03"
              label="Experience"
              detail="Ratings, recommendations and open-ended improvement ideas."
            />
            <NumberBlock
              number="04"
              label="Self-report"
              detail="Before/after wellbeing responses where voluntarily provided."
            />
          </div>
          <p className="slide-source">
            Interpret feedback cautiously: self-reported change is not proof of clinical or learner
            outcomes.
          </p>
        </SlideFrame>
      );
    case 9:
      return (
        <SlideFrame number={index} dark className="slide-deep">
          <Kicker>09 / TRUST & SAFEGUARDING</Kicker>
          <h2 className="slide-title">Mental health support has boundaries.</h2>
          <div className="slide-safety">
            <div>
              <strong>Practical, not clinical</strong>
              <p>
                The chat offers general wellbeing tips and activities. It does not diagnose,
                prescribe or replace a professional.
              </p>
            </div>
            <div>
              <strong>Human help is visible</strong>
              <p>
                Local support options include SADAG, Lifeline South Africa, Childline and emergency
                services.
              </p>
            </div>
            <div>
              <strong>Respect beneficiary data</strong>
              <p>
                Staff-only records and Excel exports should be handled under ESWA's privacy and
                safeguarding procedures.
              </p>
            </div>
          </div>
          <p className="slide-caption">
            In immediate danger in South Africa: call 112 from a cellphone. ESWA is not an emergency
            service.
          </p>
        </SlideFrame>
      );
    case 10:
      return (
        <SlideFrame number={index}>
          <Heading eyebrow="10 / WHAT HAPPENS NEXT" title="A pilot with clear learning loops." />
          <div className="slide-phases">
            {[
              [
                "01",
                "Prepare",
                "ESWA selects partner schools, owners, workshop dates and consent wording.",
              ],
              [
                "02",
                "Run",
                "Publish events, invite educators, record RSVPs and confirm attendance.",
              ],
              [
                "03",
                "Learn",
                "Review feedback, participation and gaps; adjust content and outreach.",
              ],
              ["04", "Decide", "Present aggregated findings and agree whether and how to expand."],
            ].map(([n, t, d]) => (
              <div key={n}>
                <span className="slide-phase-n">{n}</span>
                <h3 className="slide-subtitle">{t}</h3>
                <p className="slide-body slide-muted">{d}</p>
              </div>
            ))}
          </div>
          <p className="slide-source">
            Proposed pilot sequence. Timeline and targets must be agreed with ESWA before delivery.
          </p>
        </SlideFrame>
      );
    case 11:
      return (
        <SlideFrame number={index}>
          <Heading
            eyebrow="11 / JUDGING CRITERIA"
            title="A credible pilot is a measurable pilot."
          />
          <div className="slide-scorecard">
            <div>
              <span>Relevance</span>
              <strong>Solves an identified educator wellbeing and access gap</strong>
            </div>
            <div>
              <span>Usability</span>
              <strong>Beneficiaries can discover, RSVP and respond without accounts</strong>
            </div>
            <div>
              <span>Feasibility</span>
              <strong>A working public site and staff workflow are already available</strong>
            </div>
            <div>
              <span>Evidence</span>
              <strong>Track reach, attendance and feedback before claiming impact</strong>
            </div>
            <div>
              <span>Sustainability</span>
              <strong>ESWA can plan sessions and retain Excel records independently</strong>
            </div>
          </div>
        </SlideFrame>
      );
    default:
      return (
        <SlideFrame number={index} dark className="slide-deep slide-end">
          <div>
            <Kicker>12 / THE HANDOVER</Kicker>
            <h2 className="slide-title-lg">
              Ready to pilot.
              <br />
              <em>Ready to learn.</em>
            </h2>
            <p className="slide-body-lg">
              A live website, an organised workshop workflow and a way to listen to the educators
              ESWA exists to serve.
            </p>
            <div className="slide-end-link">{LIVE}</div>
          </div>
          <div className="slide-end-ask">
            <span className="slide-kicker">THE ASK</span>
            <p>
              Confirm pilot schools, workshop schedule, staff owner and safeguarding process — then
              invite the first educators.
            </p>
          </div>
        </SlideFrame>
      );
  }
}

function ScaledSlide({ index, className = "" }: { index: number; className?: string }) {
  const outer = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const element = outer.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry)
        setScale(Math.min(entry.contentRect.width / 1920, entry.contentRect.height / 1080));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={outer} className={`slide-stage ${className}`}>
      <div className="slide-wrapper" style={{ transform: `scale(${scale})` }}>
        <Slides index={index} />
      </div>
    </div>
  );
}

function Presentation() {
  const [current, setCurrent] = useState(0);
  const [overview, setOverview] = useState(false);
  const [presenting, setPresenting] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [print, setPrint] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const go = useCallback((next: number) => {
    const safe = Math.max(0, Math.min(headings.length - 1, next));
    setCurrent(safe);
    setOverview(false);
    if (typeof window !== "undefined")
      window.history.replaceState(
        window.history.state,
        "",
        `${window.location.pathname}?slide=${safe + 1}`,
      );
    document.title = `${safe + 1}/${headings.length} — ${headings[safe]} | ESWA`;
  }, []);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setPrint(params.has("print"));
    const n = Number(params.get("slide"));
    if (n >= 1 && n <= headings.length) go(n - 1);
  }, [go]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (
        event.target instanceof HTMLElement &&
        ["INPUT", "TEXTAREA"].includes(event.target.tagName)
      )
        return;
      if (event.key === "ArrowRight" || event.key === "ArrowDown" || event.key === " ") {
        event.preventDefault();
        go(current + 1);
      }
      if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        event.preventDefault();
        go(current - 1);
      }
      if (event.key.toLowerCase() === "g" && !presenting) setOverview((v) => !v);
      if (event.key === "Escape") {
        setOverview(false);
        if (document.fullscreenElement) document.exitFullscreen();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, go, presenting]);
  useEffect(() => {
    const update = () => setPresenting(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", update);
    return () => document.removeEventListener("fullscreenchange", update);
  }, []);
  const togglePresent = async () => {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await stageRef.current?.requestFullscreen();
  };
  if (print)
    return (
      <div className="slide-print">
        {headings.map((_, i) => (
          <div className="slide-print-page" key={i}>
            <Slides index={i} />
          </div>
        ))}
      </div>
    );
  return (
    <div className="deck-app">
      <header className="deck-toolbar">
        <div className="deck-toolbar-left">
          <Button asChild variant="ghost" size="icon" title="Back to ESWA">
            <Link to="/">
              <ArrowLeft />
            </Link>
          </Button>
          <span className="deck-wordmark">
            <EswaLogo /> ESWA <span>/ Pilot presentation</span>
          </span>
        </div>
        <div className="deck-toolbar-actions">
          <Button
            variant="ghost"
            size="icon"
            title="Slide overview"
            aria-label="Slide overview"
            onClick={() => setOverview(!overview)}
          >
            <Grid2X2 />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title="Print or save as PDF"
            aria-label="Print or save as PDF"
            onClick={() => window.open("/presentation?print", "_blank")}
          >
            <Printer />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowNotes(!showNotes)}>
            {showNotes ? "Hide" : "Speaker"} notes
          </Button>
          <Button size="sm" onClick={togglePresent}>
            <Maximize2 /> Present
          </Button>
        </div>
      </header>
      <div className="deck-workspace">
        <aside className="deck-sidebar">
          <div className="deck-sidebar-label">
            THE STORY <span>{headings.length} SLIDES</span>
          </div>
          {headings.map((title, i) => (
            <button
              key={title}
              className={`deck-thumb ${current === i ? "deck-thumb-active" : ""}`}
              onClick={() => go(i)}
            >
              <div className="deck-thumb-image">
                <ScaledSlide index={i} />
              </div>
              <span>
                <b>{String(i + 1).padStart(2, "0")}</b> {title}
              </span>
            </button>
          ))}
        </aside>
        <main className="deck-main">
          <div className="deck-view" ref={stageRef}>
            {overview ? (
              <div className="deck-grid">
                {headings.map((title, i) => (
                  <button key={title} onClick={() => go(i)}>
                    <ScaledSlide index={i} />
                    <span>
                      {String(i + 1).padStart(2, "0")} · {title}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <ScaledSlide index={current} className="deck-current" />
            )}
            {presenting && (
              <Button
                className="deck-exit"
                variant="secondary"
                size="icon"
                title="Exit presentation"
                aria-label="Exit presentation"
                onClick={togglePresent}
              >
                <Minimize2 />
              </Button>
            )}
          </div>
          {!presenting && (
            <div className="deck-controls">
              <span>
                {String(current + 1).padStart(2, "0")} <span className="deck-divider">/</span>{" "}
                {String(headings.length).padStart(2, "0")}
              </span>
              <div>
                <Button
                  variant="ghost"
                  size="icon"
                  title="Previous slide"
                  aria-label="Previous slide"
                  disabled={current === 0}
                  onClick={() => go(current - 1)}
                >
                  <ArrowLeft />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  title="Next slide"
                  aria-label="Next slide"
                  disabled={current === headings.length - 1}
                  onClick={() => go(current + 1)}
                >
                  <ArrowRight />
                </Button>
              </div>
            </div>
          )}
          {showNotes && !presenting && (
            <div className="deck-notes">
              <div>
                <strong>Speaker notes · {headings[current]}</strong>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Close notes"
                  onClick={() => setShowNotes(false)}
                >
                  <X />
                </Button>
              </div>
              <p>{notes[current]}</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
