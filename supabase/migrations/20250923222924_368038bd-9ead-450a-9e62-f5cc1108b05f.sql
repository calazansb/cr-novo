-- Inserir perfis para os usuários existentes
INSERT INTO public.profiles (user_id, nome, email, perfil) VALUES
('26093986-5157-4394-90ca-ce779e47a8d0', 'Eugênio', 'eugenio@calazansrossi.com.br', 'admin'),
('1ec248cd-5ea5-4b9c-81c3-2db3de935822', 'Bernardo Calazans', 'bernardo.calazans@outlook.com', 'admin'),
('dbc4fa03-86a1-4f7b-8453-cd546ee06bf2', 'Bernardo', 'bernardo@calazansrossi.com.br', 'admin')
ON CONFLICT (user_id) DO UPDATE SET 
perfil = EXCLUDED.perfil,
nome = EXCLUDED.nome,
email = EXCLUDED.email;

-- Inserir um treinamento de exemplo para testar o sistema
INSERT INTO public.treinamentos (titulo, descricao, tipo_conteudo, arquivo_url, obrigatorio, ativo, created_by) VALUES
('Introdução ao Sistema CRA', 'Treinamento básico sobre como utilizar o sistema da Calazans Rossi Advogados', 'pdf', 'https://example.com/manual-sistema.pdf', true, true, '26093986-5157-4394-90ca-ce779e47a8d0');