-- Corrigir o search_path da função atualizar_modificacao
CREATE OR REPLACE FUNCTION public.atualizar_modificacao()
RETURNS TRIGGER AS $$
BEGIN
  NEW.ultima_modificacao_por := auth.uid();
  NEW.ultima_modificacao_em := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;