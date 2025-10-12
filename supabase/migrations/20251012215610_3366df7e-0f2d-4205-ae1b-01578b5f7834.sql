-- Criar o conjunto de opções para Varas/Câmaras/Turmas
INSERT INTO public.option_sets (key, label, description)
VALUES (
  'varas_camaras_turmas',
  'Varas / Câmaras / Turmas',
  'Lista de varas, câmaras e turmas para seleção em processos judiciais'
)
ON CONFLICT (key) DO NOTHING;

-- Popular com algumas opções iniciais comuns
INSERT INTO public.option_items (option_set_id, value, label, "order", is_active)
SELECT 
  (SELECT id FROM public.option_sets WHERE key = 'varas_camaras_turmas'),
  vara,
  vara,
  row_number,
  true
FROM (
  VALUES
    ('1ª Vara Cível', 1),
    ('2ª Vara Cível', 2),
    ('3ª Vara Cível', 3),
    ('4ª Vara Cível', 4),
    ('5ª Vara Cível', 5),
    ('1ª Vara Criminal', 6),
    ('2ª Vara Criminal', 7),
    ('3ª Vara Criminal', 8),
    ('1ª Vara da Fazenda Pública', 9),
    ('2ª Vara da Fazenda Pública', 10),
    ('1ª Vara de Família', 11),
    ('2ª Vara de Família', 12),
    ('Vara de Sucessões', 13),
    ('Vara de Registros Públicos', 14),
    ('Vara de Execuções Fiscais', 15),
    ('Juizado Especial Cível', 16),
    ('Juizado Especial Criminal', 17),
    ('Juizado Especial da Fazenda Pública', 18),
    ('1ª Câmara Cível', 19),
    ('2ª Câmara Cível', 20),
    ('3ª Câmara Cível', 21),
    ('4ª Câmara Cível', 22),
    ('5ª Câmara Cível', 23),
    ('1ª Câmara Criminal', 24),
    ('2ª Câmara Criminal', 25),
    ('3ª Câmara Criminal', 26),
    ('1ª Turma', 27),
    ('2ª Turma', 28),
    ('3ª Turma', 29),
    ('4ª Turma', 30),
    ('5ª Turma', 31),
    ('6ª Turma', 32),
    ('Turma Recursal', 33),
    ('Outra', 999)
) AS varas_data(vara, row_number)
ON CONFLICT DO NOTHING;