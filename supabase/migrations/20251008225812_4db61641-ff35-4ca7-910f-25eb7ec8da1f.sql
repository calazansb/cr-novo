-- Adicionar coluna tipo_solicitacao à tabela solicitacoes_controladoria
ALTER TABLE public.solicitacoes_controladoria
ADD COLUMN tipo_solicitacao VARCHAR(100);

-- Criar índice para melhor performance nas consultas filtradas
CREATE INDEX idx_solicitacoes_tipo ON public.solicitacoes_controladoria(tipo_solicitacao);

-- Adicionar comentário para documentação
COMMENT ON COLUMN public.solicitacoes_controladoria.tipo_solicitacao IS 'Tipo da solicitação: Documentação, Consulta Jurídica, Revisão de Contrato, etc.';