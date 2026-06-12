DROP POLICY "Anyone can submit a consultation request" ON public.consultations;
CREATE POLICY "Public can submit valid consultation requests"
  ON public.consultations FOR INSERT TO anon, authenticated
  WITH CHECK (
    length(trim(full_name)) BETWEEN 2 AND 120
    AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    AND length(coalesce(message,'')) <= 2000
  );