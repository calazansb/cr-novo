-- Adicionar novos campos à tabela decisoes_judiciais conforme especificações do prompt

-- Adicionar campo para autor
ALTER TABLE decisoes_judiciais
ADD COLUMN IF NOT EXISTS autor VARCHAR(255);

-- Adicionar campo para réu  
ALTER TABLE decisoes_judiciais
ADD COLUMN IF NOT EXISTS reu VARCHAR(255);

-- Adicionar campo para polo do cliente
ALTER TABLE decisoes_judiciais
ADD COLUMN IF NOT EXISTS polo_cliente VARCHAR(20);

-- Adicionar campo para data da decisão
ALTER TABLE decisoes_judiciais
ADD COLUMN IF NOT EXISTS data_decisao DATE;

-- Adicionar campo para resultado (Favorável, Parcialmente Favorável, Desfavorável)
ALTER TABLE decisoes_judiciais
ADD COLUMN IF NOT EXISTS resultado VARCHAR(50);

-- Adicionar campo para valor em disputa
ALTER TABLE decisoes_judiciais
ADD COLUMN IF NOT EXISTS valor_disputa DECIMAL(15,2);

-- Adicionar campo para economia gerada
ALTER TABLE decisoes_judiciais
ADD COLUMN IF NOT EXISTS economia_gerada DECIMAL(15,2);

-- Adicionar campo para percentual exonerado (para cálculo de economia)
ALTER TABLE decisoes_judiciais
ADD COLUMN IF NOT EXISTS percentual_exonerado DECIMAL(5,2);

-- Adicionar campo para montante reconhecido (para cálculo de economia quando polo ativo)
ALTER TABLE decisoes_judiciais
ADD COLUMN IF NOT EXISTS montante_reconhecido DECIMAL(15,2);

-- Adicionar campo para URL do arquivo no SharePoint
ALTER TABLE decisoes_judiciais
ADD COLUMN IF NOT EXISTS arquivo_url VARCHAR(500);

-- Adicionar campo para nome do arquivo
ALTER TABLE decisoes_judiciais
ADD COLUMN IF NOT EXISTS arquivo_nome VARCHAR(255);

-- Adicionar campo para hash do arquivo (deduplicação)
ALTER TABLE decisoes_judiciais
ADD COLUMN IF NOT EXISTS hash_arquivo VARCHAR(64);

-- Adicionar campo para ID do drive no SharePoint
ALTER TABLE decisoes_judiciais
ADD COLUMN IF NOT EXISTS sharepoint_drive_id VARCHAR(255);

-- Adicionar campo para ID do item no SharePoint
ALTER TABLE decisoes_judiciais
ADD COLUMN IF NOT EXISTS sharepoint_item_id VARCHAR(255);

-- Criar tabela para análises de decisões (IA)
CREATE TABLE IF NOT EXISTS public.analises_decisoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  decisao_id UUID NOT NULL REFERENCES public.decisoes_judiciais(id) ON DELETE CASCADE,
  termos_frequentes JSONB,
  doutrinas_citadas JSONB,
  julgados_citados JSONB,
  padrao_decisao TEXT,
  data_analise TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS na tabela de análises
ALTER TABLE public.analises_decisoes ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para analises_decisoes
CREATE POLICY "Usuários autenticados podem ver análises"
  ON public.analises_decisoes
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem criar análises"
  ON public.analises_decisoes
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins podem atualizar análises"
  ON public.analises_decisoes
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins podem deletar análises"
  ON public.analises_decisoes
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_decisoes_resultado ON public.decisoes_judiciais(resultado);
CREATE INDEX IF NOT EXISTS idx_decisoes_polo_cliente ON public.decisoes_judiciais(polo_cliente);
CREATE INDEX IF NOT EXISTS idx_decisoes_data_decisao ON public.decisoes_judiciais(data_decisao);
CREATE INDEX IF NOT EXISTS idx_analises_decisao_id ON public.analises_decisoes(decisao_id);