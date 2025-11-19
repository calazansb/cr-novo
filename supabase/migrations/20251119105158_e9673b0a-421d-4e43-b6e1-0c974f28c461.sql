-- Criar tabela de jurisprudências
CREATE TABLE IF NOT EXISTS public.jurisprudencias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NULL,
  codigo_unico VARCHAR NOT NULL,
  numero_processo VARCHAR NOT NULL,
  tribunal VARCHAR NOT NULL,
  area VARCHAR NOT NULL,
  ementa TEXT NOT NULL,
  data_julgamento DATE NULL,
  relator VARCHAR NULL,
  resultado VARCHAR NULL,
  arquivo_url VARCHAR NULL,
  arquivo_nome VARCHAR NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.jurisprudencias ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Usuários autenticados podem ver jurisprudências"
  ON public.jurisprudencias
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem criar jurisprudências"
  ON public.jurisprudencias
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins podem atualizar jurisprudências"
  ON public.jurisprudencias
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins podem deletar jurisprudências"
  ON public.jurisprudencias
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

-- Trigger para código único
CREATE OR REPLACE FUNCTION public.gerar_codigo_jurisprudencia()
RETURNS TRIGGER AS $$
DECLARE
  novo_codigo VARCHAR(50);
  contador INTEGER := 1;
BEGIN
  LOOP
    novo_codigo := 'JURIS-' || TO_CHAR(NOW(), 'DD-MM-YYYY') || '-' || LPAD(contador::TEXT, 4, '0');
    IF NOT EXISTS (SELECT 1 FROM public.jurisprudencias WHERE codigo_unico = novo_codigo) THEN
      NEW.codigo_unico := novo_codigo;
      EXIT;
    END IF;
    contador := contador + 1;
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER gerar_codigo_jurisprudencia_trigger
  BEFORE INSERT ON public.jurisprudencias
  FOR EACH ROW
  EXECUTE FUNCTION public.gerar_codigo_jurisprudencia();

-- Trigger para updated_at
CREATE TRIGGER update_jurisprudencias_updated_at
  BEFORE UPDATE ON public.jurisprudencias
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();