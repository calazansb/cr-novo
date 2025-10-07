-- Adicionar policy de DELETE para administradores na tabela profiles
-- Atualmente não existe policy de DELETE, por isso as exclusões não funcionam

CREATE POLICY "Admins podem deletar usuários"
ON public.profiles
FOR DELETE
USING (is_admin());