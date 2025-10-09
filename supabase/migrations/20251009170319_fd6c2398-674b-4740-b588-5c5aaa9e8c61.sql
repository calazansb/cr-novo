-- Criar option set para magistrados
INSERT INTO public.option_sets (key, label, description)
VALUES (
  'magistrados',
  'Magistrados',
  'Lista de magistrados disponíveis no sistema'
)
ON CONFLICT (key) DO NOTHING;

-- Inserir opção "Outros" no conjunto de magistrados
INSERT INTO public.option_items (option_set_id, value, label, "order", is_active)
SELECT 
  id,
  'outros',
  'Outros',
  999,
  true
FROM public.option_sets
WHERE key = 'magistrados'
ON CONFLICT DO NOTHING;