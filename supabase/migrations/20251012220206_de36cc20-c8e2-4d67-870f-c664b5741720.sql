-- Atualizar ordem alfabética das Câmaras Cíveis
-- Em ordem alfabética: 1ª, 10ª, 11ª, 12ª, 13ª, 14ª, 15ª, 16ª, 17ª, 18ª, 19ª, 2ª, 20ª, 21ª, 3ª, 4ª, 5ª, 6ª, 7ª, 8ª, 9ª

UPDATE public.option_items
SET "order" = CASE label
  WHEN '1ª Câmara Cível' THEN 19
  WHEN '10ª Câmara Cível' THEN 28
  WHEN '11ª Câmara Cível' THEN 29
  WHEN '12ª Câmara Cível' THEN 30
  WHEN '13ª Câmara Cível' THEN 31
  WHEN '14ª Câmara Cível' THEN 32
  WHEN '15ª Câmara Cível' THEN 33
  WHEN '16ª Câmara Cível' THEN 34
  WHEN '17ª Câmara Cível' THEN 35
  WHEN '18ª Câmara Cível' THEN 36
  WHEN '19ª Câmara Cível' THEN 37
  WHEN '2ª Câmara Cível' THEN 20
  WHEN '20ª Câmara Cível' THEN 38
  WHEN '21ª Câmara Cível Especializada' THEN 39
  WHEN '3ª Câmara Cível' THEN 21
  WHEN '4ª Câmara Cível' THEN 22
  WHEN '5ª Câmara Cível' THEN 23
  WHEN '6ª Câmara Cível' THEN 24
  WHEN '7ª Câmara Cível' THEN 25
  WHEN '8ª Câmara Cível' THEN 26
  WHEN '9ª Câmara Cível' THEN 27
END
WHERE option_set_id = (SELECT id FROM public.option_sets WHERE key = 'varas_camaras_turmas')
  AND label LIKE '%Câmara Cível%';