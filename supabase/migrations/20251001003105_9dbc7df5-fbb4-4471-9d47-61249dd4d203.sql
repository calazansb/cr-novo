-- Inserir perfil de administrador para bernardo@calazansrossi.com.br
INSERT INTO public.profiles (user_id, nome, email, perfil)
VALUES (
  'dbc4fa03-86a1-4f7b-8453-cd546ee06bf2',
  'Bernardo Calazans Rossi',
  'bernardo@calazansrossi.com.br',
  'admin'
)
ON CONFLICT (user_id) 
DO UPDATE SET 
  perfil = 'admin',
  nome = 'Bernardo Calazans Rossi',
  email = 'bernardo@calazansrossi.com.br';

-- Atualizar user_metadata para garantir que o role está como admin
UPDATE auth.users 
SET raw_user_meta_data = 
  COALESCE(raw_user_meta_data, '{}'::jsonb) || 
  '{"role": "admin"}'::jsonb
WHERE id = 'dbc4fa03-86a1-4f7b-8453-cd546ee06bf2';