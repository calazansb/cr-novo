-- Recriar views sem SECURITY DEFINER (as views foram criadas automaticamente com essa propriedade)
-- Vamos dropar e recriar sem essa flag

DROP VIEW IF EXISTS public.fato_decisao CASCADE;
DROP VIEW IF EXISTS public.dim_magistrado CASCADE;
DROP VIEW IF EXISTS public.dim_tribunal CASCADE;
DROP VIEW IF EXISTS public.dim_tema CASCADE;

-- Recriar Tabela Fato: FatoDecisao (sem security definer)
CREATE VIEW public.fato_decisao 
WITH (security_invoker=true)
AS
SELECT 
  d.id as decisao_id,
  d.numero_processo as processo_id,
  d.nome_magistrado as magistrado_nome,
  EXTRACT(YEAR FROM d.data_decisao)::INTEGER as ano,
  EXTRACT(QUARTER FROM d.data_decisao)::INTEGER as trimestre,
  EXTRACT(MONTH FROM d.data_decisao)::INTEGER as mes,
  d.data_decisao,
  d.valor_disputa as valor_em_disputa_brl,
  d.economia_gerada as economia_gerada_brl,
  CASE 
    WHEN d.resultado = 'Favorável' THEN 1.0
    WHEN d.resultado = 'Parcialmente Favorável' THEN 0.5
    ELSE 0.0
  END as percentual_exito,
  CASE WHEN d.resultado = 'Favorável' THEN 1 ELSE 0 END as count_favoravel,
  CASE WHEN d.resultado = 'Parcialmente Favorável' THEN 1 ELSE 0 END as count_parcial,
  CASE WHEN d.resultado = 'Desfavorável' THEN 1 ELSE 0 END as count_desfavoravel,
  d.orgao as tribunal,
  d.vara_tribunal as camara_turma,
  d.procedimento_objeto as tema,
  d.tipo_decisao,
  d.polo_cliente,
  d.nome_cliente as cliente
FROM public.decisoes_judiciais d
WHERE d.data_decisao IS NOT NULL;

-- Dimensão: DimMagistrado
CREATE VIEW public.dim_magistrado
WITH (security_invoker=true)
AS
SELECT DISTINCT
  nome_magistrado as nome,
  orgao as tribunal,
  vara_tribunal as camara_turma
FROM public.decisoes_judiciais
WHERE nome_magistrado IS NOT NULL;

-- Dimensão: DimTribunal
CREATE VIEW public.dim_tribunal
WITH (security_invoker=true)
AS
SELECT DISTINCT
  orgao as tribunal,
  CASE 
    WHEN orgao LIKE 'STF%' OR orgao LIKE 'STJ%' THEN 'Superior'
    WHEN orgao LIKE 'TRF%' THEN 'Federal'
    WHEN orgao LIKE 'TJ%' THEN 'Estadual'
    ELSE 'Outro'
  END as esfera
FROM public.decisoes_judiciais
WHERE orgao IS NOT NULL;

-- Dimensão: DimTema
CREATE VIEW public.dim_tema
WITH (security_invoker=true)
AS
SELECT DISTINCT
  procedimento_objeto as tema_normalizado
FROM public.decisoes_judiciais
WHERE procedimento_objeto IS NOT NULL;