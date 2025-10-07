-- Corrigir função de trigger que atualiza timestamps para evitar erro 42703
-- A função agora tenta setar updated_at e, se a coluna não existir, tenta data_atualizacao

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  -- Tenta atualizar a coluna updated_at quando existir
  BEGIN
    NEW.updated_at := now();
  EXCEPTION WHEN undefined_column THEN
    -- Fallback para tabelas que usam data_atualizacao
    BEGIN
      NEW.data_atualizacao := now();
    EXCEPTION WHEN undefined_column THEN
      -- Se nenhuma das colunas existir, não faz nada
    END;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;