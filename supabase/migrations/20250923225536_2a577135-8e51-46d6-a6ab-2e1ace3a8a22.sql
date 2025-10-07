-- Garantir bucket e políticas corretas para uploads de treinamentos
-- 1) Criar bucket se não existir
insert into storage.buckets (id, name, public)
values ('treinamentos', 'treinamentos', true)
on conflict (id) do update set public = true;

-- 2) Remover políticas antigas (se existirem)
DROP POLICY IF EXISTS "Admins podem fazer upload de arquivos de treinamento" ON storage.objects;
DROP POLICY IF EXISTS "Admins podem ver arquivos de treinamento" ON storage.objects;
DROP POLICY IF EXISTS "Admins podem atualizar arquivos de treinamento" ON storage.objects;
DROP POLICY IF EXISTS "Admins podem deletar arquivos de treinamento" ON storage.objects;
DROP POLICY IF EXISTS "Usuários autenticados podem ler arquivos de treinamento" ON storage.objects;

-- 3) Recriar políticas qualificando a função com o schema "public"
CREATE POLICY "Admins podem fazer upload de arquivos de treinamento"
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'treinamentos' AND public.is_admin());

CREATE POLICY "Admins podem ver arquivos de treinamento"
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'treinamentos' AND public.is_admin());

CREATE POLICY "Admins podem atualizar arquivos de treinamento"
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'treinamentos' AND public.is_admin());

CREATE POLICY "Admins podem deletar arquivos de treinamento"
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'treinamentos' AND public.is_admin());

-- Como o bucket é público, leitura pública via rota /public não usa RLS, mas mantemos política de leitura autenticada via API padrão
CREATE POLICY "Usuários autenticados podem ler arquivos de treinamento"
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'treinamentos' AND auth.uid() IS NOT NULL);