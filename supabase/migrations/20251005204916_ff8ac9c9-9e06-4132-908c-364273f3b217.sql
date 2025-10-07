-- Corrigir: Adicionar RLS policies para a tabela Balcão Virtual
CREATE POLICY "Permitir todas as operações em Balcão Virtual"
ON public."Balcão Virtual"
FOR ALL
USING (true);

-- Habilitar proteção contra senhas vazadas
-- Nota: Isso requer configuração no Auth settings do Supabase
-- A política será aplicada automaticamente após a configuração