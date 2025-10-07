-- =====================================================
-- CORREÇÃO COMPLETA: ANEXOS + FORMATO DO CÓDIGO
-- Execute este script no SQL Editor do Lovable Cloud
-- =====================================================

-- 1️⃣ TORNAR BUCKET PÚBLICO (para anexos funcionarem)
UPDATE storage.buckets SET public = true WHERE id = 'solicitacoes-anexos';

-- Permitir leitura anônima do bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects' 
      AND policyname = 'Anon pode ler anexos solicitacoes'
  ) THEN
    CREATE POLICY "Anon pode ler anexos solicitacoes"
    ON storage.objects FOR SELECT
    TO anon
    USING (bucket_id = 'solicitacoes-anexos');
  END IF;
END $$;

-- 2️⃣ ATUALIZAR FORMATO DO CÓDIGO (CTRL-DD-MM-YYYY-NNNN)
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

-- ✅ MENSAGENS DE CONFIRMAÇÃO
DO $$
BEGIN
  RAISE NOTICE '✅ Script executado com sucesso!';
  RAISE NOTICE '📎 Bucket solicitacoes-anexos agora é público';
  RAISE NOTICE '📋 Novos códigos: CTRL-DD-MM-YYYY-NNNN';
  RAISE NOTICE '💡 Exemplo: CTRL-07-10-2025-0001';
  RAISE NOTICE '';
  RAISE NOTICE '🔄 Teste agora: crie uma nova solicitação e anexe arquivos!';
END $$;
