-- Script SQL para adicionar o campo anexos_resposta
-- Execute este script no SQL Editor do Supabase

-- Adicionar campo anexos_resposta na tabela solicitacoes_controladoria
ALTER TABLE public.solicitacoes_controladoria
ADD COLUMN IF NOT EXISTS anexos_resposta jsonb DEFAULT '[]'::jsonb;

-- Comentário explicativo
COMMENT ON COLUMN public.solicitacoes_controladoria.anexos_resposta IS 'URLs dos arquivos de resposta enviados pela controladoria';

-- Verificar se o campo foi criado
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'solicitacoes_controladoria' 
  AND column_name = 'anexos_resposta';
