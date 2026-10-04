-- ESWA: private cancel links + private joining details.
-- Run ONCE in the Supabase SQL Editor, after 0000, 0001 and 0002. Safe to re-run.
--
--   1. Every registration gets a secret cancel_token (existing ones get one too).
--   2. Joining details (Teams link, venue directions) live in a PRIVATE table that
--      only admins can read. Registrants receive them via their token only.
--   3. Two functions for the cancel page: look up a registration, and cancel it.

-- 1. Secret token per registration ----------------------------------------------
ALTER TABLE public.registrations
  ADD COLUMN IF NOT EXISTS cancel_token uuid NOT NULL DEFAULT gen_random_uuid();

CREATE UNIQUE INDEX IF NOT EXISTS registrations_cancel_token_key
  ON public.registrations (cancel_token);

-- 2. Private joining details ----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.workshop_joining_details (
  workshop_id uuid PRIMARY KEY REFERENCES public.workshops(id) ON DELETE CASCADE,
  details text NOT NULL CHECK (length(btrim(details)) BETWEEN 1 AND 1500),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.workshop_joining_details ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.workshop_joining_details FROM anon;

DROP POLICY IF EXISTS "Admins manage joining details" ON public.workshop_joining_details;
CREATE POLICY "Admins manage joining details"
  ON public.workshop_joining_details
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 3. Functions used by the confirmation email and the cancel page -----------------
CREATE OR REPLACE FUNCTION public.get_registration_by_token(p_token uuid)
RETURNS TABLE (
  full_name text,
  title text,
  starts_at timestamptz,
  duration_minutes integer,
  location text,
  joining_details text,
  is_past boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.full_name, w.title, w.starts_at, w.duration_minutes, w.location,
         d.details, (w.starts_at < now())
  FROM public.registrations r
  JOIN public.workshops w ON w.id = r.workshop_id
  LEFT JOIN public.workshop_joining_details d ON d.workshop_id = w.id
  WHERE r.cancel_token = p_token;
$$;

CREATE OR REPLACE FUNCTION public.cancel_registration(p_token uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_starts timestamptz;
BEGIN
  SELECT w.starts_at INTO v_starts
  FROM public.registrations r
  JOIN public.workshops w ON w.id = r.workshop_id
  WHERE r.cancel_token = p_token;

  IF NOT FOUND THEN
    RETURN 'not_found';
  END IF;
  IF v_starts < now() THEN
    RETURN 'closed';
  END IF;

  DELETE FROM public.registrations WHERE cancel_token = p_token;
  RETURN 'cancelled';
END;
$$;

REVOKE ALL ON FUNCTION public.get_registration_by_token(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cancel_registration(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_registration_by_token(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_registration(uuid) TO anon, authenticated;
