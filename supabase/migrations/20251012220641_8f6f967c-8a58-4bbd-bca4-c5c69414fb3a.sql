-- Corrigir ordenação com extração numérica segura
-- 1) Câmaras Cíveis agrupadas e numericamente ordenadas
UPDATE public.option_items oi
SET "order" = 10000 + COALESCE((substring(oi.label from '([0-9]+)'))::int, 999)
WHERE option_set_id = (SELECT id FROM public.option_sets WHERE key = 'varas_camaras_turmas')
  AND oi.label ILIKE '%câmara cível%';

-- 2) Câmaras Criminais após as Cíveis
UPDATE public.option_items oi
SET "order" = 20000 + COALESCE((substring(oi.label from '([0-9]+)'))::int, 999)
WHERE option_set_id = (SELECT id FROM public.option_sets WHERE key = 'varas_camaras_turmas')
  AND oi.label ILIKE '%câmara criminal%';

-- 3) 'Outra' sempre por último
UPDATE public.option_items oi
SET "order" = 999999
WHERE option_set_id = (SELECT id FROM public.option_sets WHERE key = 'varas_camaras_turmas')
  AND (lower(oi.label) = 'outra' OR lower(oi.value) = 'outra');

-- 4) Normalizar ordens nulas
UPDATE public.option_items oi
SET "order" = COALESCE("order", 50000)
WHERE option_set_id = (SELECT id FROM public.option_sets WHERE key = 'varas_camaras_turmas');