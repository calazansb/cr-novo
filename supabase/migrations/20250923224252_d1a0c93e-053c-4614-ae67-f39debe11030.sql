-- Criar bucket para armazenar arquivos de treinamentos
INSERT INTO storage.buckets (id, name, public) VALUES ('treinamentos', 'treinamentos', false);

-- Criar políticas para o bucket de treinamentos
CREATE POLICY "Admins podem fazer upload de arquivos de treinamento" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'treinamentos' AND is_admin());

CREATE POLICY "Admins podem ver arquivos de treinamento" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'treinamentos' AND is_admin());

CREATE POLICY "Admins podem atualizar arquivos de treinamento" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'treinamentos' AND is_admin());

CREATE POLICY "Admins podem deletar arquivos de treinamento" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'treinamentos' AND is_admin());

-- Política para usuários autenticados lerem arquivos (para acessar os treinamentos)
CREATE POLICY "Usuários autenticados podem ler arquivos de treinamento" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'treinamentos' AND auth.uid() IS NOT NULL);