import type { Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";

// Shared "who is signed in" state. Used by the site header so every page can
// show whether a staff member is signed in, and by the password reset page.
export function useAuthSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    try {
      supabase.auth.getSession().then(({ data }) => {
        if (!active) return;
        setSession(data.session);
        setLoading(false);
      });
      const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
        if (!active) return;
        setSession(next);
        setLoading(false);
      });
      return () => {
        active = false;
        sub.subscription.unsubscribe();
      };
    } catch {
      // Supabase not configured: public pages must still render.
      setLoading(false);
      return () => {
        active = false;
      };
    }
  }, []);

  return { session, loading };
}
