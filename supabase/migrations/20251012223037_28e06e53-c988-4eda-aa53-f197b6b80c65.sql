-- Criar tabela de decisões judiciais com número de protocolo automático
CREATE TABLE IF NOT EXISTS public.decisoes_judiciais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_unico VARCHAR(50) UNIQUE NOT NULL,
  numero_processo VARCHAR(100) NOT NULL,
  comarca VARCHAR(100),
  orgao VARCHAR(100) NOT NULL,
  vara_tribunal VARCHAR(200) NOT NULL,
  nome_cliente VARCHAR(100) NOT NULL,
  tipo_decisao VARCHAR(100) NOT NULL,
  nome_magistrado VARCHAR(100) NOT NULL,
  advogado_interno VARCHAR(100) NOT NULL,
  adverso VARCHAR(100) NOT NULL,
  procedimento_objeto VARCHAR(200) NOT NULL,
  resumo_decisao TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.decisoes_judiciais ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Usuários autenticados podem ver decisões"
ON public.decisoes_judiciais FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Usuários autenticados podem criar decisões"
ON public.decisoes_judiciais FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas decisões"
ON public.decisoes_judiciais FOR UPDATE 
TO authenticated 
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins podem deletar decisões"
ON public.decisoes_judiciais FOR DELETE 
TO authenticated 
USING (public.has_role(auth.uid(), 'admin'));

-- Função para gerar código único (protocolo)
CREATE OR REPLACE FUNCTION public.gerar_codigo_decisao()
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
    novo_codigo := 'DJ-' || TO_CHAR(NOW(), 'DD-MM-YYYY') || '-' || LPAD(contador::TEXT, 4, '0');
    IF NOT EXISTS (SELECT 1 FROM public.decisoes_judiciais WHERE codigo_unico = novo_codigo) THEN
      NEW.codigo_unico := novo_codigo;
      EXIT;
    END IF;
    contador := contador + 1;
  END LOOP;
  RETURN NEW;
END;
$$;

-- Trigger para gerar código automaticamente
DROP TRIGGER IF EXISTS trigger_gerar_codigo_decisao ON public.decisoes_judiciais;
CREATE TRIGGER trigger_gerar_codigo_decisao
  BEFORE INSERT ON public.decisoes_judiciais
  FOR EACH ROW
  EXECUTE FUNCTION public.gerar_codigo_decisao();

-- Trigger para atualizar data_atualizacao
DROP TRIGGER IF EXISTS update_decisoes_updated_at ON public.decisoes_judiciais;
CREATE TRIGGER update_decisoes_updated_at
  BEFORE UPDATE ON public.decisoes_judiciais 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();