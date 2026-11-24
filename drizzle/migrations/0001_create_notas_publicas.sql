CREATE TABLE public.notas_publicas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL DEFAULT '',
  texto text NOT NULL DEFAULT ''
);
GRANT SELECT ON public.notas_publicas TO anon, authenticated;
GRANT ALL ON public.notas_publicas TO service_role;
ALTER TABLE public.notas_publicas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lectura publica" ON public.notas_publicas
  FOR SELECT TO anon, authenticated
  USING (true);