-- =====================================================
-- ATUALIZAR FORMATO DO CÓDIGO ÚNICO
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- Atualizar a função para gerar código no formato CTRL-DD-MM-YYYY-NNNN
CREATE OR REPLACE FUNCTION public.gerar_codigo_solicitacao()
RETURNS TRIGGER AS $$
DECLARE
  novo_codigo VARCHAR(50);
  contador INTEGER := 1;
BEGIN
  -- Gera código no formato CTRL-DD-MM-YYYY-NNNN
  LOOP
    novo_codigo := 'CTRL-' || 
                   TO_CHAR(NOW(), 'DD-MM-YYYY') || '-' || 
                   LPAD(contador::TEXT, 4, '0');
    
    -- Verifica se o código já existe
    IF NOT EXISTS (SELECT 1 FROM public.solicitacoes_controladoria WHERE codigo_unico = novo_codigo) THEN
      NEW.codigo_unico := novo_codigo;
      EXIT;
    END IF;
    
    contador := contador + 1;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Mensagem de confirmação
DO $$
BEGIN
  RAISE NOTICE '✅ Função atualizada com sucesso!';
  RAISE NOTICE '📋 Novos códigos terão formato: CTRL-DD-MM-YYYY-NNNN';
  RAISE NOTICE '💡 Exemplo: CTRL-07-10-2025-0001';
END $$;
