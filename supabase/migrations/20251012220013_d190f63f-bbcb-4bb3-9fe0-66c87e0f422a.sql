-- Inserir Câmaras Cíveis faltantes (6ª a 21ª)
INSERT INTO public.option_items (option_set_id, value, label, "order", is_active)
SELECT 
  (SELECT id FROM public.option_sets WHERE key = 'varas_camaras_turmas'),
  camara,
  camara,
  row_number,
  true
FROM (
  VALUES
    ('6ª Câmara Cível', 24),
    ('7ª Câmara Cível', 25),
    ('8ª Câmara Cível', 26),
    ('9ª Câmara Cível', 27),
    ('10ª Câmara Cível', 28),
    ('11ª Câmara Cível', 29),
    ('12ª Câmara Cível', 30),
    ('13ª Câmara Cível', 31),
    ('14ª Câmara Cível', 32),
    ('15ª Câmara Cível', 33),
    ('16ª Câmara Cível', 34),
    ('17ª Câmara Cível', 35),
    ('18ª Câmara Cível', 36),
    ('19ª Câmara Cível', 37),
    ('20ª Câmara Cível', 38),
    ('21ª Câmara Cível Especializada', 39)
) AS camaras_data(camara, row_number)
ON CONFLICT DO NOTHING;