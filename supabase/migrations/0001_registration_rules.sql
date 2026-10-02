-- Server-side rules for workshop registrations.
-- Run once in the Supabase SQL Editor (after 0000_eswa_core_schema.sql).
-- Enforces, at the database level (the browser cannot bypass this):
--   * capacity (no overbooking, even with two people registering at once)
--   * the workshop must exist and be published
--   * name / email format and field length limits
--   * attended is always false on a new registration

CREATE OR REPLACE FUNCTION public.enforce_registration_rules()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_capacity int;
  v_published boolean;
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
  SELECT capacity, is_published INTO v_capacity, v_published
  FROM public.workshops
  WHERE id = NEW.workshop_id
  FOR UPDATE;

  IF NOT FOUND OR NOT v_published THEN
    RAISE EXCEPTION 'workshop_unavailable' USING ERRCODE = 'P0001';
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

DROP TRIGGER IF EXISTS registrations_enforce_rules ON public.registrations;
CREATE TRIGGER registrations_enforce_rules
  BEFORE INSERT ON public.registrations
  FOR EACH ROW EXECUTE FUNCTION public.enforce_registration_rules();
