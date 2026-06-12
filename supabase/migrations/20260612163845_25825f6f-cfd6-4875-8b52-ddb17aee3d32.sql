CREATE TABLE public.consultations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  client_type TEXT NOT NULL CHECK (client_type IN ('individual','business','both')),
  service TEXT NOT NULL,
  preferred_date DATE,
  province TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.consultations TO anon, authenticated;
GRANT ALL ON public.consultations TO service_role;
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit a consultation request"
  ON public.consultations FOR INSERT TO anon, authenticated WITH CHECK (true);