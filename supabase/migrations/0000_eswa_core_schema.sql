
-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'staff');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE POLICY "Users can read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Allowlist of ESWA staff emails that automatically receive the admin role on signup
CREATE TABLE public.staff_allowlist (
  email text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.staff_allowlist TO service_role;
ALTER TABLE public.staff_allowlist ENABLE ROW LEVEL SECURITY;

INSERT INTO public.staff_allowlist (email) VALUES ('nkhumelenindae777@gmail.com');

CREATE OR REPLACE FUNCTION public.grant_admin_if_allowlisted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.staff_allowlist WHERE lower(email) = lower(NEW.email)) THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_grant_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.grant_admin_if_allowlisted();

-- Workshops
CREATE TABLE public.workshops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  programme text NOT NULL DEFAULT 'School Wellbeing Workshops',
  facilitator text,
  starts_at timestamptz NOT NULL,
  duration_minutes int NOT NULL DEFAULT 90,
  location text NOT NULL DEFAULT 'Online (Microsoft Teams)',
  capacity int NOT NULL DEFAULT 50,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.workshops TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.workshops TO authenticated;
GRANT ALL ON public.workshops TO service_role;
ALTER TABLE public.workshops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published workshops" ON public.workshops
  FOR SELECT TO anon, authenticated USING (is_published = true);
CREATE POLICY "Admins can view all workshops" ON public.workshops
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert workshops" ON public.workshops
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update workshops" ON public.workshops
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete workshops" ON public.workshops
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Registrations (no account needed)
CREATE TABLE public.registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id uuid NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  school text,
  role_at_school text,
  province text,
  dietary_or_access_needs text,
  attended boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workshop_id, email)
);
GRANT INSERT ON public.registrations TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.registrations TO authenticated;
GRANT ALL ON public.registrations TO service_role;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can register" ON public.registrations
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins can view registrations" ON public.registrations
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update registrations" ON public.registrations
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete registrations" ON public.registrations
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Public count of registrations per workshop (no PII)
CREATE OR REPLACE FUNCTION public.workshop_registration_counts()
RETURNS TABLE (workshop_id uuid, registration_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.workshop_id, count(*)::bigint
  FROM public.registrations r
  JOIN public.workshops w ON w.id = r.workshop_id AND w.is_published
  GROUP BY r.workshop_id;
$$;
GRANT EXECUTE ON FUNCTION public.workshop_registration_counts() TO anon, authenticated;

-- Feedback / questionnaire
CREATE TABLE public.feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id uuid REFERENCES public.workshops(id) ON DELETE SET NULL,
  full_name text,
  email text,
  school text,
  role_at_school text,
  overall_rating int NOT NULL,
  wellbeing_before int,
  wellbeing_after int,
  stress_level int,
  most_valuable text,
  improvements text,
  future_topics text,
  would_recommend boolean,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.feedback TO anon, authenticated;
GRANT SELECT, DELETE ON public.feedback TO authenticated;
GRANT ALL ON public.feedback TO service_role;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit feedback" ON public.feedback
  FOR INSERT TO anon, authenticated WITH CHECK (
    overall_rating BETWEEN 1 AND 5
  );
CREATE POLICY "Admins can view feedback" ON public.feedback
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete feedback" ON public.feedback
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Seed workshops
INSERT INTO public.workshops (title, description, programme, facilitator, starts_at, duration_minutes, location, capacity) VALUES
('Burnout Prevention for Educators', 'A practical session on recognising early signs of burnout, setting boundaries and building recovery habits that fit a full teaching week.', 'School Wellbeing Workshops', 'Ms. Sesethu Zongwana', now() + interval '10 days' + interval '9 hours', 120, 'Johannesburg CBD (venue shared on confirmation)', 40),
('Stress Management and Resilience', 'Evidence-informed tools for managing classroom stress, regulating emotions and recovering after demanding days.', 'Teacher Wellness Programme', 'ESWA Wellness Team', now() + interval '18 days' + interval '10 hours', 90, 'Online (Microsoft Teams)', 100),
('Leading Psychologically Healthy Schools', 'A capacity-building session for School Management Teams on building a supportive, psychologically safe staff culture.', 'Leadership Wellbeing Support', 'ESWA Leadership Faculty', now() + interval '25 days' + interval '8 hours', 180, 'Pretoria (venue shared on confirmation)', 30),
('Professional Learning Community Circle', 'A facilitated peer support circle where educators share challenges, reflect together and learn from one another.', 'Professional Learning Communities', 'ESWA Facilitators', now() + interval '32 days' + interval '15 hours', 75, 'Online (Microsoft Teams)', 60),
('Work-Life Balance and Emotional Intelligence', 'Interactive workshop on protecting personal time, communicating well under pressure and strengthening emotional intelligence.', 'School Wellbeing Workshops', 'ESWA Wellness Team', now() + interval '45 days' + interval '9 hours', 120, 'Cape Town (venue shared on confirmation)', 45);
