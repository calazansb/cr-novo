-- =====================================================
-- SCRIPT SQL COMPLETO - SISTEMA CRA
-- Calazans Rossi Advogados - Sistema de Comunicação
-- =====================================================
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- =====================================================
-- 1. SISTEMA DE ROLES (SEGURANÇA CRÍTICA)
-- =====================================================

-- Criar enum para roles
CREATE TYPE IF NOT EXISTS public.app_role AS ENUM ('admin', 'advogado', 'assistente', 'user');

-- Tabela de roles dos usuários (NUNCA em user_metadata!)
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role public.app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (user_id, role)
);

-- Habilitar RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Função security definer para verificar roles (evita recursão)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Função para obter role do usuário
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS public.app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY 
    CASE role
      WHEN 'admin' THEN 1
      WHEN 'advogado' THEN 2
      WHEN 'assistente' THEN 3
      ELSE 4
    END
  LIMIT 1
$$;

-- Policies para user_roles
CREATE POLICY "Usuários podem ver suas próprias roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins podem ver todas as roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins podem inserir roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins podem atualizar roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins podem deletar roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- 2. TABELA DE SOLICITAÇÕES DA CONTROLADORIA
-- =====================================================

CREATE TABLE IF NOT EXISTS public.solicitacoes_controladoria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_unico VARCHAR(50) UNIQUE NOT NULL DEFAULT '',
  nome_solicitante VARCHAR(100) NOT NULL,
  numero_processo VARCHAR(100),
  cliente VARCHAR(100) NOT NULL,
  objeto_solicitacao VARCHAR(200) NOT NULL,
  descricao_detalhada TEXT NOT NULL,
  anexos TEXT[], -- Array de URLs de anexos
  status VARCHAR(50) DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_andamento', 'concluido', 'cancelado')),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  observacoes TEXT
);

-- Função para gerar código único
CREATE OR REPLACE FUNCTION public.gerar_codigo_solicitacao()
RETURNS TRIGGER AS $$
DECLARE
  novo_codigo VARCHAR(50);
  contador INTEGER := 1;
BEGIN
  -- Gera código no formato CTRL-YYYYMMDD-NNNN
  LOOP
    novo_codigo := 'CTRL-' || 
                   TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
                   LPAD(contador::TEXT, 4, '0');
    
    -- Verifica se o código já existe
    IF NOT EXISTS (SELECT 1 FROM public.solicitacoes_controladoria WHERE codigo_unico = novo_codigo) THEN
      NEW.codigo_unico := novo_codigo;
      EXIT;
    END IF;
    
    contador := contador + 1;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para gerar código automaticamente
DROP TRIGGER IF EXISTS trigger_gerar_codigo_solicitacao ON public.solicitacoes_controladoria;
CREATE TRIGGER trigger_gerar_codigo_solicitacao
  BEFORE INSERT ON public.solicitacoes_controladoria
  FOR EACH ROW
  EXECUTE FUNCTION public.gerar_codigo_solicitacao();

-- RLS para solicitações
ALTER TABLE public.solicitacoes_controladoria ENABLE ROW LEVEL SECURITY;

-- Todos podem ver todas as solicitações (authenticated)
CREATE POLICY "Usuários autenticados podem ver solicitações"
ON public.solicitacoes_controladoria
FOR SELECT
TO authenticated
USING (true);

-- Todos podem criar solicitações
CREATE POLICY "Usuários autenticados podem criar solicitações"
ON public.solicitacoes_controladoria
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Usuários podem atualizar suas próprias solicitações OU admins podem atualizar qualquer uma
CREATE POLICY "Usuários podem atualizar suas próprias solicitações"
ON public.solicitacoes_controladoria
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid() OR 
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'advogado')
);

-- Apenas admins podem deletar
CREATE POLICY "Admins podem deletar solicitações"
ON public.solicitacoes_controladoria
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- 3. TABELA DE TREINAMENTOS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.treinamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo VARCHAR(200) NOT NULL,
  descricao TEXT,
  categoria VARCHAR(100),
  duracao_estimada INTEGER, -- Em minutos
  arquivo_url VARCHAR(500),
  arquivo_nome VARCHAR(200),
  tipo_arquivo VARCHAR(50), -- 'video', 'pdf', 'documento', etc.
  obrigatorio BOOLEAN DEFAULT false,
  ordem INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS para treinamentos
ALTER TABLE public.treinamentos ENABLE ROW LEVEL SECURITY;

-- Todos podem ver treinamentos ativos
CREATE POLICY "Usuários autenticados podem ver treinamentos"
ON public.treinamentos
FOR SELECT
TO authenticated
USING (ativo = true);

-- Admins podem criar/editar/deletar
CREATE POLICY "Admins podem gerenciar treinamentos"
ON public.treinamentos
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- 4. TABELA DE PROGRESSO DE TREINAMENTOS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.treinamentos_progresso (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  treinamento_id UUID REFERENCES public.treinamentos(id) ON DELETE CASCADE NOT NULL,
  concluido BOOLEAN DEFAULT false,
  tempo_assistido INTEGER DEFAULT 0, -- Em segundos
  data_inicio TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_conclusao TIMESTAMP WITH TIME ZONE,
  UNIQUE (user_id, treinamento_id)
);

-- RLS para progresso
ALTER TABLE public.treinamentos_progresso ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver e atualizar seu próprio progresso
CREATE POLICY "Usuários podem gerenciar seu próprio progresso"
ON public.treinamentos_progresso
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Admins podem ver todo progresso
CREATE POLICY "Admins podem ver todo progresso"
ON public.treinamentos_progresso
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- 5. OUTRAS TABELAS DO SISTEMA
-- =====================================================

-- Tabela de Decisões Judiciais
CREATE TABLE IF NOT EXISTS public.decisoes_judiciais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_processo VARCHAR(100) NOT NULL,
  vara_tribunal VARCHAR(200),
  nome_cliente VARCHAR(100) NOT NULL,
  tipo_decisao VARCHAR(100) NOT NULL,
  advogado_interno VARCHAR(100),
  adverso VARCHAR(100),
  procedimento_objeto VARCHAR(200),
  resumo_decisao TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  status VARCHAR(50) DEFAULT 'ativo',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.decisoes_judiciais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados podem ver decisões"
ON public.decisoes_judiciais FOR SELECT TO authenticated USING (true);

CREATE POLICY "Usuários autenticados podem criar decisões"
ON public.decisoes_judiciais FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Usuários podem atualizar suas decisões"
ON public.decisoes_judiciais FOR UPDATE TO authenticated 
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins podem deletar decisões"
ON public.decisoes_judiciais FOR DELETE TO authenticated 
USING (public.has_role(auth.uid(), 'admin'));

-- Tabela de Banco de Dados / Jurisprudências
CREATE TABLE IF NOT EXISTS public.jurisprudencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_processo VARCHAR(100),
  tribunal VARCHAR(200) NOT NULL,
  tipo_documento VARCHAR(100) NOT NULL,
  data_julgamento DATE,
  relator VARCHAR(200),
  ementa TEXT NOT NULL,
  resumo TEXT,
  area_direito VARCHAR(100),
  palavras_chave TEXT[],
  tags VARCHAR[],
  arquivo_url VARCHAR(500),
  arquivo_nome VARCHAR(200),
  conteudo_texto TEXT,
  relevancia INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.jurisprudencias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados podem ver jurisprudências"
ON public.jurisprudencias FOR SELECT TO authenticated USING (ativo = true);

CREATE POLICY "Advogados podem criar jurisprudências"
ON public.jurisprudencias FOR INSERT TO authenticated 
WITH CHECK (public.has_role(auth.uid(), 'advogado') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Usuários podem atualizar suas jurisprudências"
ON public.jurisprudencias FOR UPDATE TO authenticated 
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins podem deletar jurisprudências"
ON public.jurisprudencias FOR DELETE TO authenticated 
USING (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- 6. FUNÇÃO DE ATUALIZAÇÃO AUTOMÁTICA
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
DROP TRIGGER IF EXISTS update_user_roles_updated_at ON public.user_roles;
CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_solicitacoes_updated_at ON public.solicitacoes_controladoria;
CREATE TRIGGER update_solicitacoes_updated_at
  BEFORE UPDATE ON public.solicitacoes_controladoria
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_treinamentos_updated_at ON public.treinamentos;
CREATE TRIGGER update_treinamentos_updated_at
  BEFORE UPDATE ON public.treinamentos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_decisoes_updated_at ON public.decisoes_judiciais;
CREATE TRIGGER update_decisoes_updated_at
  BEFORE UPDATE ON public.decisoes_judiciais
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_jurisprudencias_updated_at ON public.jurisprudencias;
CREATE TRIGGER update_jurisprudencias_updated_at
  BEFORE UPDATE ON public.jurisprudencias
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 7. ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para solicitações
CREATE INDEX IF NOT EXISTS idx_solicitacoes_status ON public.solicitacoes_controladoria(status);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_user_id ON public.solicitacoes_controladoria(user_id);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_data_criacao ON public.solicitacoes_controladoria(data_criacao DESC);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_codigo ON public.solicitacoes_controladoria(codigo_unico);

-- Índices para treinamentos
CREATE INDEX IF NOT EXISTS idx_treinamentos_categoria ON public.treinamentos(categoria);
CREATE INDEX IF NOT EXISTS idx_treinamentos_obrigatorio ON public.treinamentos(obrigatorio);
CREATE INDEX IF NOT EXISTS idx_treinamentos_ordem ON public.treinamentos(ordem);

-- Índices para jurisprudências
CREATE INDEX IF NOT EXISTS idx_jurisprudencias_area_direito ON public.jurisprudencias(area_direito);
CREATE INDEX IF NOT EXISTS idx_jurisprudencias_tribunal ON public.jurisprudencias(tribunal);
CREATE INDEX IF NOT EXISTS idx_jurisprudencias_data ON public.jurisprudencias(data_julgamento);
CREATE INDEX IF NOT EXISTS idx_jurisprudencias_palavras_chave ON public.jurisprudencias USING GIN(palavras_chave);
CREATE INDEX IF NOT EXISTS idx_jurisprudencias_tags ON public.jurisprudencias USING GIN(tags);

-- Índices para roles
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- =====================================================
-- 8. STORAGE BUCKETS PARA ARQUIVOS
-- =====================================================

-- Bucket para treinamentos
INSERT INTO storage.buckets (id, name, public)
VALUES ('treinamentos', 'treinamentos', true)
ON CONFLICT (id) DO NOTHING;

-- Bucket para anexos de solicitações
INSERT INTO storage.buckets (id, name, public)
VALUES ('solicitacoes-anexos', 'solicitacoes-anexos', false)
ON CONFLICT (id) DO NOTHING;

-- Bucket para jurisprudências
INSERT INTO storage.buckets (id, name, public)
VALUES ('jurisprudencias', 'jurisprudencias', false)
ON CONFLICT (id) DO NOTHING;

-- Policies para storage de treinamentos (execute DEPOIS de criar os buckets)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Todos podem ver arquivos de treinamento'
  ) THEN
    CREATE POLICY "Todos podem ver arquivos de treinamento"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (bucket_id = 'treinamentos');
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Admins podem fazer upload de treinamentos'
  ) THEN
    CREATE POLICY "Admins podem fazer upload de treinamentos"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'treinamentos' AND 
      (public.has_role(auth.uid(), 'admin'))
    );
  END IF;
END $$;

-- Policies para storage de anexos
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Usuários autenticados podem ver anexos'
  ) THEN
    CREATE POLICY "Usuários autenticados podem ver anexos"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (bucket_id = 'solicitacoes-anexos');
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Usuários autenticados podem fazer upload de anexos'
  ) THEN
    CREATE POLICY "Usuários autenticados podem fazer upload de anexos"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'solicitacoes-anexos');
  END IF;
END $$;

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================

-- Verificação final
DO $$
BEGIN
  RAISE NOTICE '✅ Script executado com sucesso!';
  RAISE NOTICE '📊 Tabelas criadas:';
  RAISE NOTICE '   - user_roles (sistema de permissões)';
  RAISE NOTICE '   - solicitacoes_controladoria';
  RAISE NOTICE '   - treinamentos';
  RAISE NOTICE '   - treinamentos_progresso';
  RAISE NOTICE '   - decisoes_judiciais';
  RAISE NOTICE '   - jurisprudencias';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 RLS habilitado em todas as tabelas';
  RAISE NOTICE '🚀 Sistema pronto para uso!';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  IMPORTANTE: Configure seu usuário como admin executando:';
  RAISE NOTICE '   1. Vá em Authentication > Users no Supabase';
  RAISE NOTICE '   2. Copie o UUID do seu usuário';
  RAISE NOTICE '   3. Execute: INSERT INTO public.user_roles (user_id, role) VALUES (''seu-uuid-aqui'', ''admin'');';
END $$;
