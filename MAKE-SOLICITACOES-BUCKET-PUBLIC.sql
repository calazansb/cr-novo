-- Torna o bucket 'solicitacoes-anexos' público para permitir abrir links diretamente
UPDATE storage.buckets SET public = true WHERE id = 'solicitacoes-anexos';

-- (Opcional, se a policy ainda não existir) Permitir leitura anônima do bucket
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