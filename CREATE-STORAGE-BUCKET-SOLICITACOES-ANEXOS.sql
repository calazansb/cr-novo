-- Cria o bucket de arquivos para solicitações se ainda não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'solicitacoes-anexos'
  ) THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('solicitacoes-anexos', 'solicitacoes-anexos', true);
  END IF;
END $$;

-- Política: leitura pública dos arquivos do bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects' 
      AND policyname = 'Public read for solicitacoes-anexos'
  ) THEN
    CREATE POLICY "Public read for solicitacoes-anexos"
      ON storage.objects
      FOR SELECT
      USING (bucket_id = 'solicitacoes-anexos');
  END IF;
END $$;

-- Política: usuários autenticados podem fazer upload (inserir) no bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects' 
      AND policyname = 'Authenticated upload to solicitacoes-anexos'
  ) THEN
    CREATE POLICY "Authenticated upload to solicitacoes-anexos"
      ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'solicitacoes-anexos');
  END IF;
END $$;

-- Política: usuários autenticados podem atualizar objetos no bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects' 
      AND policyname = 'Authenticated update solicitacoes-anexos'
  ) THEN
    CREATE POLICY "Authenticated update solicitacoes-anexos"
      ON storage.objects
      FOR UPDATE TO authenticated
      USING (bucket_id = 'solicitacoes-anexos')
      WITH CHECK (bucket_id = 'solicitacoes-anexos');
  END IF;
END $$;

-- Política: usuários autenticados podem deletar objetos no bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects' 
      AND policyname = 'Authenticated delete solicitacoes-anexos'
  ) THEN
    CREATE POLICY "Authenticated delete solicitacoes-anexos"
      ON storage.objects
      FOR DELETE TO authenticated
      USING (bucket_id = 'solicitacoes-anexos');
  END IF;
END $$;
