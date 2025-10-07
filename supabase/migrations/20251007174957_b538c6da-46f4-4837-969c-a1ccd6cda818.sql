-- Adicionar foreign key para ultima_modificacao_por
ALTER TABLE public.solicitacoes_controladoria
DROP CONSTRAINT IF EXISTS solicitacoes_controladoria_ultima_modificacao_por_fkey;

ALTER TABLE public.solicitacoes_controladoria
ADD CONSTRAINT solicitacoes_controladoria_ultima_modificacao_por_fkey
FOREIGN KEY (ultima_modificacao_por) 
REFERENCES public.profiles(id) 
ON DELETE SET NULL;