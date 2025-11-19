-- Tabela para armazenar automações configuradas
CREATE TABLE IF NOT EXISTS public.automacoes_juridicas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_unico VARCHAR(50) UNIQUE NOT NULL,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  tipo_automacao VARCHAR(50) NOT NULL, -- 'consulta_cnj', 'monitoramento_processo', 'verificacao_prazos'
  status VARCHAR(20) DEFAULT 'ativa', -- 'ativa', 'pausada', 'concluida', 'erro'
  frequencia VARCHAR(20) NOT NULL, -- 'diaria', 'semanal', 'mensal', 'horaria'
  parametros JSONB, -- Parâmetros específicos da automação
  proxima_execucao TIMESTAMP WITH TIME ZONE,
  ultima_execucao TIMESTAMP WITH TIME ZONE,
  total_execucoes INTEGER DEFAULT 0,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para armazenar resultados das execuções
CREATE TABLE IF NOT EXISTS public.execucoes_automacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  automacao_id UUID NOT NULL REFERENCES public.automacoes_juridicas(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL, -- 'sucesso', 'erro', 'parcial'
  mensagem TEXT,
  dados_retorno JSONB,
  tempo_execucao_ms INTEGER,
  executado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para processos monitorados
CREATE TABLE IF NOT EXISTS public.processos_monitorados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_processo VARCHAR(25) NOT NULL,
  cliente VARCHAR(255),
  orgao VARCHAR(100),
  ultima_verificacao TIMESTAMP WITH TIME ZONE,
  ultima_atualizacao_detectada TIMESTAMP WITH TIME ZONE,
  dados_atuais JSONB,
  notificacoes_enviadas INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'ativo', -- 'ativo', 'pausado', 'arquivado'
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(numero_processo, user_id)
);

-- Índices para melhor performance
CREATE INDEX idx_automacoes_user ON public.automacoes_juridicas(user_id);
CREATE INDEX idx_automacoes_status ON public.automacoes_juridicas(status);
CREATE INDEX idx_automacoes_proxima_exec ON public.automacoes_juridicas(proxima_execucao);
CREATE INDEX idx_execucoes_automacao ON public.execucoes_automacoes(automacao_id);
CREATE INDEX idx_processos_monitorados_user ON public.processos_monitorados(user_id);
CREATE INDEX idx_processos_monitorados_numero ON public.processos_monitorados(numero_processo);

-- RLS Policies
ALTER TABLE public.automacoes_juridicas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.execucoes_automacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processos_monitorados ENABLE ROW LEVEL SECURITY;

-- Políticas para automacoes_juridicas
CREATE POLICY "Usuários podem ver suas próprias automações"
  ON public.automacoes_juridicas FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar suas próprias automações"
  ON public.automacoes_juridicas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias automações"
  ON public.automacoes_juridicas FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas próprias automações"
  ON public.automacoes_juridicas FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas para execucoes_automacoes
CREATE POLICY "Usuários podem ver execuções de suas automações"
  ON public.execucoes_automacoes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.automacoes_juridicas
      WHERE id = execucoes_automacoes.automacao_id
      AND user_id = auth.uid()
    )
  );

-- Políticas para processos_monitorados
CREATE POLICY "Usuários podem ver seus processos monitorados"
  ON public.processos_monitorados FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar processos monitorados"
  ON public.processos_monitorados FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus processos monitorados"
  ON public.processos_monitorados FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus processos monitorados"
  ON public.processos_monitorados FOR DELETE
  USING (auth.uid() = user_id);

-- Função para gerar código único de automação
CREATE OR REPLACE FUNCTION public.gerar_codigo_automacao()
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
    novo_codigo := 'AUTO-' || TO_CHAR(NOW(), 'DD-MM-YYYY') || '-' || LPAD(contador::TEXT, 4, '0');
    IF NOT EXISTS (SELECT 1 FROM public.automacoes_juridicas WHERE codigo_unico = novo_codigo) THEN
      NEW.codigo_unico := novo_codigo;
      EXIT;
    END IF;
    contador := contador + 1;
  END LOOP;
  RETURN NEW;
END;
$$;

-- Trigger para gerar código automático
CREATE TRIGGER trigger_gerar_codigo_automacao
  BEFORE INSERT ON public.automacoes_juridicas
  FOR EACH ROW
  WHEN (NEW.codigo_unico IS NULL OR NEW.codigo_unico = '')
  EXECUTE FUNCTION public.gerar_codigo_automacao();

-- Trigger para atualizar updated_at
CREATE TRIGGER trigger_automacoes_updated_at
  BEFORE UPDATE ON public.automacoes_juridicas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_processos_monitorados_updated_at
  BEFORE UPDATE ON public.processos_monitorados
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Comentários para documentação
COMMENT ON TABLE public.automacoes_juridicas IS 'Armazena as automações configuradas para consultas jurídicas';
COMMENT ON TABLE public.execucoes_automacoes IS 'Histórico de execuções das automações';
COMMENT ON TABLE public.processos_monitorados IS 'Processos que estão sendo monitorados automaticamente';
COMMENT ON COLUMN public.automacoes_juridicas.tipo_automacao IS 'Tipo da automação: consulta_cnj, monitoramento_processo, verificacao_prazos';
COMMENT ON COLUMN public.automacoes_juridicas.frequencia IS 'Frequência de execução: diaria, semanal, mensal, horaria';
COMMENT ON COLUMN public.automacoes_juridicas.parametros IS 'JSON com parâmetros específicos da automação (números de processo, filtros, etc.)';
COMMENT ON COLUMN public.processos_monitorados.dados_atuais IS 'JSON com os dados mais recentes do processo obtidos da API';