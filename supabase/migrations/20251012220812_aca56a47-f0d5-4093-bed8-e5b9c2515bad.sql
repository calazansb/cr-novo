-- Reordenar manualmente cada item com valores específicos
-- Câmaras Cíveis: 10001-10021
UPDATE public.option_items
SET "order" = CASE label
  WHEN '1ª Câmara Cível' THEN 10001
  WHEN '2ª Câmara Cível' THEN 10002
  WHEN '3ª Câmara Cível' THEN 10003
  WHEN '4ª Câmara Cível' THEN 10004
  WHEN '5ª Câmara Cível' THEN 10005
  WHEN '6ª Câmara Cível' THEN 10006
  WHEN '7ª Câmara Cível' THEN 10007
  WHEN '8ª Câmara Cível' THEN 10008
  WHEN '9ª Câmara Cível' THEN 10009
  WHEN '10ª Câmara Cível' THEN 10010
  WHEN '11ª Câmara Cível' THEN 10011
  WHEN '12ª Câmara Cível' THEN 10012
  WHEN '13ª Câmara Cível' THEN 10013
  WHEN '14ª Câmara Cível' THEN 10014
  WHEN '15ª Câmara Cível' THEN 10015
  WHEN '16ª Câmara Cível' THEN 10016
  WHEN '17ª Câmara Cível' THEN 10017
  WHEN '18ª Câmara Cível' THEN 10018
  WHEN '19ª Câmara Cível' THEN 10019
  WHEN '20ª Câmara Cível' THEN 10020
  WHEN '21ª Câmara Cível Especializada' THEN 10021
END
WHERE option_set_id = (SELECT id FROM public.option_sets WHERE key = 'varas_camaras_turmas')
  AND label LIKE '%Câmara Cível%';

-- Câmaras Criminais: 20001-20003
UPDATE public.option_items
SET "order" = CASE label
  WHEN '1ª Câmara Criminal' THEN 20001
  WHEN '2ª Câmara Criminal' THEN 20002
  WHEN '3ª Câmara Criminal' THEN 20003
END
WHERE option_set_id = (SELECT id FROM public.option_sets WHERE key = 'varas_camaras_turmas')
  AND label LIKE '%Câmara Criminal%';

-- Outra sempre por último
UPDATE public.option_items
SET "order" = 999999
WHERE option_set_id = (SELECT id FROM public.option_sets WHERE key = 'varas_camaras_turmas')
  AND label = 'Outra';