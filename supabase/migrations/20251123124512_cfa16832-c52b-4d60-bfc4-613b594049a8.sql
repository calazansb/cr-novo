-- Adicionar campo de abreviação na tabela clientes
ALTER TABLE public.clientes 
ADD COLUMN abreviacao VARCHAR(10);

-- Criar índice para busca por abreviação
CREATE INDEX idx_clientes_abreviacao ON public.clientes(abreviacao);

-- Adicionar comentário explicativo
COMMENT ON COLUMN public.clientes.abreviacao IS 'Abreviação do nome do cliente para uso em nomes de arquivos e pastas no SharePoint';