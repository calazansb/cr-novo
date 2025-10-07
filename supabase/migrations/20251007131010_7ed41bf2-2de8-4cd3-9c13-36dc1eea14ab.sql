-- Setup solicitacoes_controladoria table, code generation, and storage bucket for anexos
-- 1) Table
CREATE TABLE IF NOT EXISTS public.solicitacoes_controladoria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_unico VARCHAR(50) UNIQUE NOT NULL,
  nome_solicitante VARCHAR(100) NOT NULL,
  numero_processo VARCHAR(100),
  cliente VARCHAR(100) NOT NULL,
  objeto_solicitacao VARCHAR(200) NOT NULL,
  descricao_detalhada TEXT NOT NULL,
  anexos TEXT[] DEFAULT ARRAY[]::TEXT[],
  anexos_resposta TEXT[] DEFAULT ARRAY[]::TEXT[],
  status VARCHAR(50) DEFAULT 'pendente' CHECK (status IN ('pendente','em_andamento','concluida','cancelada')),
  user_id UUID,
  data_criacao TIMESTAMPTZ NOT NULL DEFAULT now(),
  data_atualizacao TIMESTAMPTZ NOT NULL DEFAULT now(),
  observacoes TEXT
);

-- 2) RLS policies (allow app to operate without auth for now)
ALTER TABLE public.solicitacoes_controladoria ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='solicitacoes_controladoria' AND policyname='App pode tudo - solicitacoes')
  THEN
    CREATE POLICY "App pode tudo - solicitacoes"
    ON public.solicitacoes_controladoria
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);
  END IF;
END $$;

-- 3) Code generation function and trigger (CTRL-DD-MM-YYYY-NNNN)
CREATE OR REPLACE FUNCTION public.gerar_codigo_solicitacao()
RETURNS TRIGGER AS $$
DECLARE
  novo_codigo VARCHAR(50);
  contador INTEGER := 1;
BEGIN
  LOOP
    novo_codigo := 'CTRL-' || TO_CHAR(NOW(), 'DD-MM-YYYY') || '-' || LPAD(contador::TEXT, 4, '0');
    IF NOT EXISTS (SELECT 1 FROM public.solicitacoes_controladoria WHERE codigo_unico = novo_codigo) THEN
      NEW.codigo_unico := novo_codigo;
      EXIT;
    END IF;
    contador := contador + 1;
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_gerar_codigo_solicitacao ON public.solicitacoes_controladoria;
CREATE TRIGGER trigger_gerar_codigo_solicitacao
  BEFORE INSERT ON public.solicitacoes_controladoria
  FOR EACH ROW
  EXECUTE FUNCTION public.gerar_codigo_solicitacao();

-- 4) Timestamp update trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.data_atualizacao = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_solicitacoes_updated_at ON public.solicitacoes_controladoria;
CREATE TRIGGER update_solicitacoes_updated_at
  BEFORE UPDATE ON public.solicitacoes_controladoria
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 5) Storage bucket for anexos (public), with policies
INSERT INTO storage.buckets (id, name, public)
VALUES ('solicitacoes-anexos', 'solicitacoes-anexos', true)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Public read for solicitacoes-anexos')
  THEN
    CREATE POLICY "Public read for solicitacoes-anexos"
    ON storage.objects
    FOR SELECT
    TO anon, authenticated
    USING (bucket_id = 'solicitacoes-anexos');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Authenticated upload to solicitacoes-anexos')
  THEN
    CREATE POLICY "Authenticated upload to solicitacoes-anexos"
    ON storage.objects
    FOR INSERT TO anon, authenticated
    WITH CHECK (bucket_id = 'solicitacoes-anexos');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Authenticated update solicitacoes-anexos')
  THEN
    CREATE POLICY "Authenticated update solicitacoes-anexos"
    ON storage.objects
    FOR UPDATE TO anon, authenticated
    USING (bucket_id = 'solicitacoes-anexos')
    WITH CHECK (bucket_id = 'solicitacoes-anexos');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Authenticated delete solicitacoes-anexos')
  THEN
    CREATE POLICY "Authenticated delete solicitacoes-anexos"
    ON storage.objects
    FOR DELETE TO anon, authenticated
    USING (bucket_id = 'solicitacoes-anexos');
  END IF;
END $$;
