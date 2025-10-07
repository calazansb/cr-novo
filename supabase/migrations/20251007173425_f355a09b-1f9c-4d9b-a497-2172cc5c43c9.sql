-- Adicionar campos de rastreamento de modificações
ALTER TABLE public.solicitacoes_controladoria 
ADD COLUMN IF NOT EXISTS ultima_modificacao_por UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS ultima_modificacao_em TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Criar trigger para atualizar automaticamente os campos de modificação
CREATE OR REPLACE FUNCTION public.atualizar_modificacao()
RETURNS TRIGGER AS $$
BEGIN
  NEW.ultima_modificacao_por := auth.uid();
  NEW.ultima_modificacao_em := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar trigger antes de UPDATE
DROP TRIGGER IF EXISTS trigger_atualizar_modificacao ON public.solicitacoes_controladoria;
CREATE TRIGGER trigger_atualizar_modificacao
  BEFORE UPDATE ON public.solicitacoes_controladoria
  FOR EACH ROW
  EXECUTE FUNCTION public.atualizar_modificacao();

-- Atualizar registros existentes com o user_id como última modificação
UPDATE public.solicitacoes_controladoria
SET ultima_modificacao_por = user_id,
    ultima_modificacao_em = data_atualizacao
WHERE ultima_modificacao_por IS NULL;