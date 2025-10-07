-- Adicionar campo prazo_retorno à tabela solicitacoes_controladoria
ALTER TABLE public.solicitacoes_controladoria 
ADD COLUMN IF NOT EXISTS prazo_retorno DATE;