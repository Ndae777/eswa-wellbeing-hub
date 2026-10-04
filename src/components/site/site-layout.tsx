import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Menu,
  Home,
  CalendarDays,
  CalendarRange,
  HeartPulse,
  MessageCircleHeart,
  ClipboardList,
  LayoutDashboard,
  LogOut,
} from "lucide-react";
import { useState, type ReactNode } from "react";

import { EswaLogo } from "@/components/site/eswa-logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuthSession } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { ESWA } from "@/lib/eswa-content";

const nav = [
  { to: "/", label: "Home", icon: Home },
  { to: "/about", label: "About ESWA", icon: HeartPulse },
  { to: "/workshops", label: "Workshops", icon: CalendarDays },
  { to: "/calendar", label: "Calendar", icon: CalendarRange },
  { to: "/resources", label: "Mental health", icon: HeartPulse },
  { to: "/chat", label: "Wellness chat", icon: MessageCircleHeart },
  { to: "/feedback", label: "Feedback", icon: ClipboardList },
] as const;

const bottomNav = [
  { to: "/", label: "Home", icon: Home },
  { to: "/workshops", label: "Workshops", icon: CalendarDays },
  { to: "/resources", label: "Support", icon: HeartPulse },
  { to: "/chat", label: "Chat", icon: MessageCircleHeart },
  { to: "/feedback", label: "Feedback", icon: ClipboardList },
] as const;

export function SiteLayout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { session } = useAuthSession();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  async function signOut() {
    setOpen(false);
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    await navigate({ to: "/" });
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
      >
        Skip to main content
      </a>
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2 text-primary">
            <EswaLogo />
            <span className="font-display text-xl font-bold tracking-tight">ESWA</span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.to === "/" }}
                className="rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground data-[status=active]:bg-secondary data-[status=active]:text-primary"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {session ? (
              <div className="hidden items-center gap-1 sm:flex">
                <Button asChild variant="outline" size="sm">
                  <Link to="/staff" title={session.user.email ?? "Staff"}>
                    <span className="mr-2 h-2 w-2 rounded-full bg-green-500" aria-hidden="true" />
                    <LayoutDashboard className="mr-1 h-4 w-4" />
                    Staff dashboard
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" onClick={() => void signOut()}>
                  <LogOut className="mr-1 h-4 w-4" />
                  Sign out
                </Button>
              </div>
            ) : null}
            <Button asChild size="sm" className="hidden sm:inline-flex">
              <Link to="/workshops">Register for a workshop</Link>
            </Button>
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <SheetTitle className="font-display text-lg">Menu</SheetTitle>
                <nav className="mt-6 flex flex-col gap-1">
                  {nav.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary data-[status=active]:bg-secondary data-[status=active]:text-primary"
                    >
                      <item.icon className="h-4 w-4 text-primary" />
                      {item.label}
                    </Link>
                  ))}
                  {session ? (
                    <>
                      <Link
                        to="/staff"
                        onClick={() => setOpen(false)}
                        className="mt-4 flex items-center gap-3 rounded-lg bg-secondary px-3 py-3 text-sm font-medium text-primary"
                      >
                        <LayoutDashboard className="h-4 w-4" />
                        Staff dashboard
                      </Link>
                      <p className="px-3 text-xs text-muted-foreground">
                        Signed in as {session.user.email}
                      </p>
                      <button
                        type="button"
                        onClick={() => void signOut()}
                        className="flex items-center gap-3 rounded-lg px-3 py-3 text-left text-sm text-muted-foreground hover:bg-secondary"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign out
                      </button>
                    </>
                  ) : null}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main id="main-content" tabIndex={-1} className="flex-1 pb-20 outline-none lg:pb-0">
        {children}
      </main>

      <footer className="border-t border-border bg-secondary/40">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <div className="flex items-center gap-2 text-primary">
              <EswaLogo />
              <span className="font-display text-lg font-bold">ESWA</span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{ESWA.name}</p>
            <p className="mt-1 text-sm italic text-muted-foreground">{ESWA.tagline}</p>
          </div>
          <div className="text-sm">
            <h3 className="font-display text-base">Contact</h3>
            <p className="mt-3 text-muted-foreground">
              <a className="hover:text-primary" href={`mailto:${ESWA.email}`}>
                {ESWA.email}
              </a>
            </p>
            <p className="mt-1 text-muted-foreground">
              <a className="hover:text-primary" href={`tel:${ESWA.phone.replace(/\s/g, "")}`}>
                {ESWA.phone}
              </a>
            </p>
            <p className="mt-1 text-muted-foreground">{ESWA.location}</p>
          </div>
          <div className="text-sm">
            <h3 className="font-display text-base">In a crisis?</h3>
            <p className="mt-3 text-muted-foreground">
              SADAG 24hr helpline <span className="font-medium text-foreground">0800 456 789</span>
            </p>
            <p className="mt-1 text-muted-foreground">
              Lifeline SA <span className="font-medium text-foreground">0861 322 322</span>
            </p>
            <Link
              to="/resources"
              className="mt-3 inline-block font-medium text-primary hover:underline"
            >
              All support numbers →
            </Link>
          </div>
        </div>
        <div className="border-t border-border/60 px-4 py-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} {ESWA.name}. ESWA provides wellbeing support and is not an
          emergency service.{" "}
          <Link to="/staff" className="underline-offset-2 hover:text-primary hover:underline">
            ESWA staff sign in
          </Link>
        </div>
      </footer>

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-lg items-stretch justify-between px-2 py-1">
          {bottomNav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              className="flex flex-1 flex-col items-center gap-1 rounded-lg px-1 py-2 text-[11px] font-medium text-muted-foreground data-[status=active]:text-primary"
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
