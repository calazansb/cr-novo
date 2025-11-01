-- Criar bucket para decisões judiciais
INSERT INTO storage.buckets (id, name, public)
VALUES ('decisoes-judiciais', 'decisoes-judiciais', false)
ON CONFLICT (id) DO NOTHING;

-- Políticas de acesso ao bucket
CREATE POLICY "Usuários autenticados podem fazer upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'decisoes-judiciais' AND auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem ver arquivos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'decisoes-judiciais' AND auth.uid() IS NOT NULL);

CREATE POLICY "Admins podem deletar arquivos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'decisoes-judiciais' AND has_role(auth.uid(), 'admin'::app_role));

-- Criar tabelas complementares conforme o prompt

-- Tabela de Processos
CREATE TABLE IF NOT EXISTS public.processos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_cnj VARCHAR(30) UNIQUE NOT NULL,
  classe_processual VARCHAR(255),
  instancia VARCHAR(50),
  vara VARCHAR(100),
  polo_cliente VARCHAR(20),
  cliente_id UUID,
  valor_causa DECIMAL(15,2),
  assunto VARCHAR(255),
  tribunal VARCHAR(100),
  camara_turma VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Decisores (Magistrados)
CREATE TABLE IF NOT EXISTS public.decisores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  tipo VARCHAR(50), -- Juiz, Desembargador, Ministro
  tribunal VARCHAR(100),
  camara_turma VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Partes
CREATE TABLE IF NOT EXISTS public.partes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  processo_id UUID REFERENCES public.processos(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  tipo VARCHAR(50), -- Autor, Réu, Interessado, Cliente
  documento VARCHAR(20)
);

-- Tabela de Doutrinas
CREATE TABLE IF NOT EXISTS public.doutrinas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  analise_id UUID REFERENCES public.analises_decisoes(id) ON DELETE CASCADE,
  doutrinador VARCHAR(255),
  obra VARCHAR(500),
  trecho TEXT,
  fonte VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Julgados Citados
CREATE TABLE IF NOT EXISTS public.julgados_citados (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  analise_id UUID REFERENCES public.analises_decisoes(id) ON DELETE CASCADE,
  numero_processo VARCHAR(50),
  tribunal VARCHAR(100),
  data_julgamento DATE,
  trecho TEXT,
  fonte VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS nas novas tabelas
ALTER TABLE public.processos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decisores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doutrinas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.julgados_citados ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para processos
CREATE POLICY "Usuários autenticados podem ver processos"
ON public.processos FOR SELECT
TO authenticated USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem criar processos"
ON public.processos FOR INSERT
TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins podem atualizar processos"
ON public.processos FOR UPDATE
TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Políticas RLS para decisores
CREATE POLICY "Usuários autenticados podem ver decisores"
ON public.decisores FOR SELECT
TO authenticated USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem criar decisores"
ON public.decisores FOR INSERT
TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

-- Políticas RLS para partes
CREATE POLICY "Usuários autenticados podem ver partes"
ON public.partes FOR SELECT
TO authenticated USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem criar partes"
ON public.partes FOR INSERT
TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

-- Políticas RLS para doutrinas
CREATE POLICY "Usuários autenticados podem ver doutrinas"
ON public.doutrinas FOR SELECT
TO authenticated USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem criar doutrinas"
ON public.doutrinas FOR INSERT
TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

-- Políticas RLS para julgados_citados
CREATE POLICY "Usuários autenticados podem ver julgados"
ON public.julgados_citados FOR SELECT
TO authenticated USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem criar julgados"
ON public.julgados_citados FOR INSERT
TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_processos_numero_cnj ON public.processos(numero_cnj);
CREATE INDEX IF NOT EXISTS idx_decisores_nome ON public.decisores(nome);
CREATE INDEX IF NOT EXISTS idx_partes_processo_id ON public.partes(processo_id);
CREATE INDEX IF NOT EXISTS idx_doutrinas_analise_id ON public.doutrinas(analise_id);
CREATE INDEX IF NOT EXISTS idx_julgados_analise_id ON public.julgados_citados(analise_id);

-- Views para Power BI (Modelo Estrela)

-- Tabela Fato: FatoDecisao
CREATE OR REPLACE VIEW public.fato_decisao AS
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
CREATE OR REPLACE VIEW public.dim_magistrado AS
SELECT DISTINCT
  nome_magistrado as nome,
  orgao as tribunal,
  vara_tribunal as camara_turma
FROM public.decisoes_judiciais
WHERE nome_magistrado IS NOT NULL;

-- Dimensão: DimTribunal  
CREATE OR REPLACE VIEW public.dim_tribunal AS
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
CREATE OR REPLACE VIEW public.dim_tema AS
SELECT DISTINCT
  procedimento_objeto as tema_normalizado
FROM public.decisoes_judiciais
WHERE procedimento_objeto IS NOT NULL;