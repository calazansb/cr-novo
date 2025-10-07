-- Criar tabela de perfis de usuários
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  nome VARCHAR NOT NULL,
  email VARCHAR NOT NULL,
  perfil VARCHAR NOT NULL CHECK (perfil IN ('admin', 'advogado')) DEFAULT 'advogado',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS na tabela profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Política para perfis - usuários podem ver todos os perfis mas só editar o próprio
CREATE POLICY "Profiles são visíveis por todos usuários autenticados" ON public.profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Usuários podem atualizar próprio perfil" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir próprio perfil" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Adicionar coluna user_id na tabela de solicitações da controladoria
ALTER TABLE public.solicitacoes_controladoria 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Atualizar política da tabela solicitacoes_controladoria para permitir que advogados vejam apenas suas próprias solicitações
DROP POLICY IF EXISTS "Permitir acesso completo para todos" ON public.solicitacoes_controladoria;

-- Função para verificar se é admin
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = user_uuid AND perfil = 'admin'
  );
$$;

-- Políticas para solicitações controladoria
CREATE POLICY "Admins podem ver todas solicitações" ON public.solicitacoes_controladoria
  FOR SELECT TO authenticated USING (public.is_admin());

CREATE POLICY "Advogados podem ver próprias solicitações" ON public.solicitacoes_controladoria
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Usuários autenticados podem inserir solicitações" ON public.solicitacoes_controladoria
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins podem atualizar todas solicitações" ON public.solicitacoes_controladoria
  FOR UPDATE TO authenticated USING (public.is_admin());

CREATE POLICY "Advogados podem atualizar próprias solicitações" ON public.solicitacoes_controladoria
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Admins podem deletar todas solicitações" ON public.solicitacoes_controladoria
  FOR DELETE TO authenticated USING (public.is_admin());

-- Criar tabelas para sistema de treinamentos
CREATE TABLE IF NOT EXISTS public.treinamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo VARCHAR NOT NULL,
  descricao TEXT,
  obrigatorio BOOLEAN DEFAULT false,
  ativo BOOLEAN DEFAULT true,
  arquivo_url VARCHAR,
  arquivo_nome VARCHAR,
  tipo_conteudo VARCHAR CHECK (tipo_conteudo IN ('pdf', 'video', 'texto', 'link')) DEFAULT 'pdf',
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.treinamentos ENABLE ROW LEVEL SECURITY;

-- Políticas para treinamentos
CREATE POLICY "Usuários autenticados podem ver treinamentos ativos" ON public.treinamentos
  FOR SELECT TO authenticated USING (ativo = true);

CREATE POLICY "Apenas admins podem inserir treinamentos" ON public.treinamentos
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

CREATE POLICY "Apenas admins podem atualizar treinamentos" ON public.treinamentos
  FOR UPDATE TO authenticated USING (public.is_admin());

CREATE POLICY "Apenas admins podem deletar treinamentos" ON public.treinamentos
  FOR DELETE TO authenticated USING (public.is_admin());

-- Tabela para rastrear progresso dos usuários nos treinamentos
CREATE TABLE IF NOT EXISTS public.treinamento_progresso (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  treinamento_id UUID REFERENCES public.treinamentos(id) ON DELETE CASCADE NOT NULL,
  iniciado_em TIMESTAMP WITH TIME ZONE DEFAULT now(),
  concluido_em TIMESTAMP WITH TIME ZONE,
  tempo_total_segundos INTEGER DEFAULT 0,
  pagina_atual INTEGER DEFAULT 1,
  total_paginas INTEGER DEFAULT 1,
  concluido BOOLEAN DEFAULT false,
  UNIQUE(user_id, treinamento_id)
);

-- Habilitar RLS
ALTER TABLE public.treinamento_progresso ENABLE ROW LEVEL SECURITY;

-- Políticas para progresso
CREATE POLICY "Usuários podem ver próprio progresso" ON public.treinamento_progresso
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Admins podem ver todo progresso" ON public.treinamento_progresso
  FOR SELECT TO authenticated USING (public.is_admin());

CREATE POLICY "Usuários podem inserir próprio progresso" ON public.treinamento_progresso
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Usuários podem atualizar próprio progresso" ON public.treinamento_progresso
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- Tabela para rastrear tempo detalhado por página/seção
CREATE TABLE IF NOT EXISTS public.treinamento_tempo_detalhado (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  progresso_id UUID REFERENCES public.treinamento_progresso(id) ON DELETE CASCADE NOT NULL,
  pagina INTEGER NOT NULL,
  secao VARCHAR,
  tempo_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
  tempo_fim TIMESTAMP WITH TIME ZONE,
  segundos_gastos INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.treinamento_tempo_detalhado ENABLE ROW LEVEL SECURITY;

-- Políticas para tempo detalhado
CREATE POLICY "Usuários podem ver próprio tempo detalhado" ON public.treinamento_tempo_detalhado
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.treinamento_progresso 
      WHERE id = progresso_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins podem ver todo tempo detalhado" ON public.treinamento_tempo_detalhado
  FOR SELECT TO authenticated USING (public.is_admin());

CREATE POLICY "Usuários podem inserir próprio tempo detalhado" ON public.treinamento_tempo_detalhado
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.treinamento_progresso 
      WHERE id = progresso_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem atualizar próprio tempo detalhado" ON public.treinamento_tempo_detalhado
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.treinamento_progresso 
      WHERE id = progresso_id AND user_id = auth.uid()
    )
  );

-- Trigger para atualizar updated_at nos treinamentos
CREATE OR REPLACE FUNCTION public.update_updated_at_treinamentos()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_treinamentos_updated_at
  BEFORE UPDATE ON public.treinamentos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_treinamentos();

-- Trigger para atualizar tempo total no progresso quando tempo detalhado é adicionado
CREATE OR REPLACE FUNCTION public.atualizar_tempo_total_progresso()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.treinamento_progresso 
  SET tempo_total_segundos = (
    SELECT COALESCE(SUM(segundos_gastos), 0)
    FROM public.treinamento_tempo_detalhado 
    WHERE progresso_id = NEW.progresso_id
  )
  WHERE id = NEW.progresso_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_atualizar_tempo_total
  AFTER INSERT OR UPDATE ON public.treinamento_tempo_detalhado
  FOR EACH ROW
  EXECUTE FUNCTION public.atualizar_tempo_total_progresso();