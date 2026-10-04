-- ESWA security hardening. Run ONCE in the Supabase SQL Editor, after 0000 and 0001.
-- Safe to run again: every step checks before it changes anything.
--
-- What this does:
--   1. Registrations: also refuse sign-ups for workshops that already happened.
--   2. Feedback: server-side rules (ratings in range, lengths, email format).
--   3. Workshops: seats and duration must be sensible numbers.
--   4. Admin access: only granted to an allow-listed email AFTER that email is
--      confirmed, so nobody can claim an admin email by signing up with it.
--   5. has_role(): no longer callable by anonymous visitors.

-- 1. Registrations ---------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_registration_rules()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_capacity int;
  v_published boolean;
  v_starts timestamptz;
  v_count int;
BEGIN
  NEW.full_name := btrim(NEW.full_name);
  NEW.email := lower(btrim(NEW.email));
  NEW.attended := false;

  IF length(NEW.full_name) < 2 OR length(NEW.full_name) > 120 THEN
    RAISE EXCEPTION 'invalid_name' USING ERRCODE = 'P0001';
  END IF;

  IF length(NEW.email) > 254
     OR NEW.email !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$' THEN
    RAISE EXCEPTION 'invalid_email' USING ERRCODE = 'P0001';
  END IF;

  IF length(coalesce(NEW.phone, '')) > 30
     OR length(coalesce(NEW.school, '')) > 200
     OR length(coalesce(NEW.role_at_school, '')) > 120
     OR length(coalesce(NEW.province, '')) > 60
     OR length(coalesce(NEW.dietary_or_access_needs, '')) > 500 THEN
    RAISE EXCEPTION 'field_too_long' USING ERRCODE = 'P0001';
  END IF;

  -- Lock the workshop row so two simultaneous sign-ups cannot both take the last seat.
  SELECT capacity, is_published, starts_at INTO v_capacity, v_published, v_starts
  FROM public.workshops
  WHERE id = NEW.workshop_id
  FOR UPDATE;

  IF NOT FOUND OR NOT v_published THEN
    RAISE EXCEPTION 'workshop_unavailable' USING ERRCODE = 'P0001';
  END IF;

  IF v_starts < now() THEN
    RAISE EXCEPTION 'workshop_closed' USING ERRCODE = 'P0001';
  END IF;

  SELECT count(*) INTO v_count
  FROM public.registrations
  WHERE workshop_id = NEW.workshop_id;

  IF v_count >= v_capacity THEN
    RAISE EXCEPTION 'workshop_full' USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

-- 2. Feedback --------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_feedback_rules()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.full_name := nullif(btrim(coalesce(NEW.full_name, '')), '');
  NEW.email := nullif(lower(btrim(coalesce(NEW.email, ''))), '');
  NEW.school := nullif(btrim(coalesce(NEW.school, '')), '');
  NEW.role_at_school := nullif(btrim(coalesce(NEW.role_at_school, '')), '');
  NEW.most_valuable := nullif(btrim(coalesce(NEW.most_valuable, '')), '');
  NEW.improvements := nullif(btrim(coalesce(NEW.improvements, '')), '');
  NEW.future_topics := nullif(btrim(coalesce(NEW.future_topics, '')), '');

  IF NEW.overall_rating IS NULL OR NEW.overall_rating NOT BETWEEN 1 AND 5 THEN
    RAISE EXCEPTION 'invalid_rating' USING ERRCODE = 'P0001';
  END IF;
  IF (NEW.stress_level IS NOT NULL AND NEW.stress_level NOT BETWEEN 1 AND 10)
     OR (NEW.wellbeing_before IS NOT NULL AND NEW.wellbeing_before NOT BETWEEN 1 AND 10)
     OR (NEW.wellbeing_after IS NOT NULL AND NEW.wellbeing_after NOT BETWEEN 1 AND 10) THEN
    RAISE EXCEPTION 'invalid_rating' USING ERRCODE = 'P0001';
  END IF;
  IF (NEW.wellbeing_before IS NULL) <> (NEW.wellbeing_after IS NULL) THEN
    RAISE EXCEPTION 'incomplete_wellbeing' USING ERRCODE = 'P0001';
  END IF;

  IF NEW.email IS NOT NULL
     AND (length(NEW.email) > 254
          OR NEW.email !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$') THEN
    RAISE EXCEPTION 'invalid_email' USING ERRCODE = 'P0001';
  END IF;

  IF length(coalesce(NEW.full_name, '')) > 120
     OR length(coalesce(NEW.school, '')) > 200
     OR length(coalesce(NEW.role_at_school, '')) > 120
     OR length(coalesce(NEW.most_valuable, '')) > 1000
     OR length(coalesce(NEW.improvements, '')) > 1000
     OR length(coalesce(NEW.future_topics, '')) > 1000 THEN
    RAISE EXCEPTION 'field_too_long' USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS feedback_enforce_rules ON public.feedback;
CREATE TRIGGER feedback_enforce_rules
  BEFORE INSERT ON public.feedback
  FOR EACH ROW EXECUTE FUNCTION public.enforce_feedback_rules();

-- 3. Workshops: sensible numbers -------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'workshops_capacity_sane') THEN
    ALTER TABLE public.workshops
      ADD CONSTRAINT workshops_capacity_sane CHECK (capacity BETWEEN 1 AND 1000);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'workshops_duration_sane') THEN
    ALTER TABLE public.workshops
      ADD CONSTRAINT workshops_duration_sane CHECK (duration_minutes BETWEEN 15 AND 720);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'workshops_title_present') THEN
    ALTER TABLE public.workshops
      ADD CONSTRAINT workshops_title_present CHECK (length(btrim(title)) >= 3);
  END IF;
END
$$;

-- 4. Admin access only for CONFIRMED allow-listed emails -------------------
CREATE OR REPLACE FUNCTION public.grant_admin_if_allowlisted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email_confirmed_at IS NOT NULL
     AND EXISTS (SELECT 1 FROM public.staff_allowlist WHERE lower(email) = lower(NEW.email)) THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- Also run when an account becomes confirmed later (for example when an
-- administrator creates the user and the confirmation is stamped just after).
DROP TRIGGER IF EXISTS on_auth_user_confirmed_grant_admin ON auth.users;
CREATE TRIGGER on_auth_user_confirmed_grant_admin
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
  EXECUTE FUNCTION public.grant_admin_if_allowlisted();

-- 5. has_role(): signed-in users and the server only ------------------------
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
