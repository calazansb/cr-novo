-- Adiciona política RLS para UPDATE na tabela pendencias_urgencias
CREATE POLICY "Usuários autenticados podem atualizar pendências"
ON public.pendencias_urgencias
FOR UPDATE
USING (auth.uid() = user_id OR is_admin())
WITH CHECK (auth.uid() = user_id OR is_admin());