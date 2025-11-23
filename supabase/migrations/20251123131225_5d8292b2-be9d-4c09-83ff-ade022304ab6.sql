-- Adicionar constraint UNIQUE para a coluna abreviacao na tabela clientes
ALTER TABLE public.clientes 
ADD CONSTRAINT clientes_abreviacao_key UNIQUE (abreviacao);