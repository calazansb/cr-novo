-- Criar tabela de clientes
CREATE TABLE IF NOT EXISTS public.clientes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  telefone VARCHAR(50),
  cpf_cnpj VARCHAR(20),
  endereco TEXT,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

-- Criar política para admins poderem gerenciar clientes
CREATE POLICY "Admins podem ver todos os clientes" 
ON public.clientes 
FOR SELECT 
USING (is_admin());

CREATE POLICY "Admins podem criar clientes" 
ON public.clientes 
FOR INSERT 
WITH CHECK (is_admin());

CREATE POLICY "Admins podem atualizar clientes" 
ON public.clientes 
FOR UPDATE 
USING (is_admin());

CREATE POLICY "Admins podem deletar clientes" 
ON public.clientes 
FOR DELETE 
USING (is_admin());

-- Adicionar trigger para updated_at
CREATE TRIGGER update_clientes_updated_at
BEFORE UPDATE ON public.clientes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Adicionar índices para melhor performance
CREATE INDEX idx_clientes_nome ON public.clientes(nome);
CREATE INDEX idx_clientes_email ON public.clientes(email);
CREATE INDEX idx_clientes_cpf_cnpj ON public.clientes(cpf_cnpj);

-- Adicionar novo tipo de role: cliente
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'cliente';