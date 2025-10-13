-- Criar tabela de sugestões e erros
CREATE TABLE IF NOT EXISTS public.sugestoes_erros (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo_unico VARCHAR(50) NOT NULL UNIQUE,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('sugestao', 'erro')),
  categoria VARCHAR(100) NOT NULL,
  titulo VARCHAR(150) NOT NULL,
  descricao TEXT NOT NULL,
  beneficios TEXT,
  urgencia VARCHAR(50) NOT NULL,
  tipo_erro VARCHAR(100),
  gravidade VARCHAR(50),
  numero_processo VARCHAR(100),
  responsavel VARCHAR(100),
  cliente VARCHAR(100),
  prazo_correcao VARCHAR(100),
  impacto TEXT,
  acao_corretiva TEXT,
  status VARCHAR(50) DEFAULT 'pendente',
  observacoes TEXT,
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de assistência técnica
CREATE TABLE IF NOT EXISTS public.assistencia_tecnica (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo_unico VARCHAR(50) NOT NULL UNIQUE,
  nome_solicitante VARCHAR(100) NOT NULL,
  solicitacao_problema TEXT NOT NULL,
  nivel_urgencia VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'pendente',
  observacoes TEXT,
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Função para gerar código de sugestões/erros
CREATE OR REPLACE FUNCTION public.gerar_codigo_sugestao_erro()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  novo_codigo VARCHAR(50);
  contador INTEGER := 1;
  prefixo VARCHAR(10);
BEGIN
  -- Define o prefixo baseado no tipo
  IF NEW.tipo = 'sugestao' THEN
    prefixo := 'SUG-';
  ELSE
    prefixo := 'ERR-';
  END IF;
  
  LOOP
    novo_codigo := prefixo || TO_CHAR(NOW(), 'DD-MM-YYYY') || '-' || LPAD(contador::TEXT, 4, '0');
    IF NOT EXISTS (SELECT 1 FROM public.sugestoes_erros WHERE codigo_unico = novo_codigo) THEN
      NEW.codigo_unico := novo_codigo;
      EXIT;
    END IF;
    contador := contador + 1;
  END LOOP;
  RETURN NEW;
END;
$$;

-- Função para gerar código de assistência técnica
CREATE OR REPLACE FUNCTION public.gerar_codigo_assistencia()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  novo_codigo VARCHAR(50);
  contador INTEGER := 1;
BEGIN
  LOOP
    novo_codigo := 'AST-' || TO_CHAR(NOW(), 'DD-MM-YYYY') || '-' || LPAD(contador::TEXT, 4, '0');
    IF NOT EXISTS (SELECT 1 FROM public.assistencia_tecnica WHERE codigo_unico = novo_codigo) THEN
      NEW.codigo_unico := novo_codigo;
      EXIT;
    END IF;
    contador := contador + 1;
  END LOOP;
  RETURN NEW;
END;
$$;

-- Criar triggers para geração automática de códigos
CREATE TRIGGER trigger_codigo_sugestao_erro
  BEFORE INSERT ON public.sugestoes_erros
  FOR EACH ROW
  EXECUTE FUNCTION public.gerar_codigo_sugestao_erro();

CREATE TRIGGER trigger_codigo_assistencia
  BEFORE INSERT ON public.assistencia_tecnica
  FOR EACH ROW
  EXECUTE FUNCTION public.gerar_codigo_assistencia();

-- Criar triggers para updated_at
CREATE TRIGGER trigger_update_sugestoes_erros
  BEFORE UPDATE ON public.sugestoes_erros
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_update_assistencia
  BEFORE UPDATE ON public.assistencia_tecnica
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar RLS
ALTER TABLE public.sugestoes_erros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assistencia_tecnica ENABLE ROW LEVEL SECURITY;

-- Políticas para sugestoes_erros
CREATE POLICY "Usuários autenticados podem ver sugestões/erros"
  ON public.sugestoes_erros
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem criar sugestões/erros"
  ON public.sugestoes_erros
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas sugestões/erros"
  ON public.sugestoes_erros
  FOR UPDATE
  USING ((auth.uid() = user_id) OR is_admin());

CREATE POLICY "Admins podem deletar sugestões/erros"
  ON public.sugestoes_erros
  FOR DELETE
  USING (is_admin());

-- Políticas para assistencia_tecnica
CREATE POLICY "Usuários autenticados podem ver assistências"
  ON public.assistencia_tecnica
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem criar assistências"
  ON public.assistencia_tecnica
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas assistências"
  ON public.assistencia_tecnica
  FOR UPDATE
  USING ((auth.uid() = user_id) OR is_admin());

CREATE POLICY "Admins podem deletar assistências"
  ON public.assistencia_tecnica
  FOR DELETE
  USING (is_admin());

-- Criar índices
CREATE INDEX idx_sugestoes_erros_tipo ON public.sugestoes_erros(tipo);
CREATE INDEX idx_sugestoes_erros_status ON public.sugestoes_erros(status);
CREATE INDEX idx_sugestoes_erros_created_at ON public.sugestoes_erros(created_at);
CREATE INDEX idx_assistencia_status ON public.assistencia_tecnica(status);
CREATE INDEX idx_assistencia_created_at ON public.assistencia_tecnica(created_at);