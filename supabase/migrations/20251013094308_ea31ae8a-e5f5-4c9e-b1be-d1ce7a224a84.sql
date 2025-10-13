-- Criar tabela para pendências/urgências
CREATE TABLE public.pendencias_urgencias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo_unico VARCHAR(50) NOT NULL UNIQUE,
  numero_processo VARCHAR(100) NOT NULL,
  orgao VARCHAR(100) NOT NULL,
  tipo_urgencia VARCHAR(50) NOT NULL,
  prazo_limite DATE NOT NULL,
  responsavel VARCHAR(100) NOT NULL,
  cliente VARCHAR(100) NOT NULL,
  descricao TEXT NOT NULL,
  observacoes TEXT,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.pendencias_urgencias ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Usuários autenticados podem ver pendências"
ON public.pendencias_urgencias
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem criar pendências"
ON public.pendencias_urgencias
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins podem deletar pendências"
ON public.pendencias_urgencias
FOR DELETE
USING (is_admin());

-- Função para gerar código automático
CREATE OR REPLACE FUNCTION public.gerar_codigo_pendencia()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  novo_codigo VARCHAR(50);
  contador INTEGER := 1;
BEGIN
  LOOP
    novo_codigo := 'PEND-' || TO_CHAR(NOW(), 'DD-MM-YYYY') || '-' || LPAD(contador::TEXT, 4, '0');
    IF NOT EXISTS (SELECT 1 FROM public.pendencias_urgencias WHERE codigo_unico = novo_codigo) THEN
      NEW.codigo_unico := novo_codigo;
      EXIT;
    END IF;
    contador := contador + 1;
  END LOOP;
  RETURN NEW;
END;
$$;

-- Trigger para gerar código antes de inserir
CREATE TRIGGER trigger_gerar_codigo_pendencia
BEFORE INSERT ON public.pendencias_urgencias
FOR EACH ROW
EXECUTE FUNCTION public.gerar_codigo_pendencia();

-- Trigger para atualizar updated_at
CREATE TRIGGER update_pendencias_urgencias_updated_at
BEFORE UPDATE ON public.pendencias_urgencias
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();