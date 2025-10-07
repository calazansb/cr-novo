-- Script SQL para criar tabelas necessárias no Supabase
-- Execute este código no SQL Editor do Supabase

-- Tabela de Decisões Judiciais
CREATE TABLE IF NOT EXISTS decisoes_judiciais (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_processo VARCHAR NOT NULL,
  tipo_decisao VARCHAR NOT NULL,
  conteudo_decisao TEXT NOT NULL,
  cliente VARCHAR NOT NULL,
  status VARCHAR DEFAULT 'ativo',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Pendências
CREATE TABLE IF NOT EXISTS pendencias (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo VARCHAR NOT NULL,
  descricao TEXT NOT NULL,
  prazo_limite DATE,
  prioridade VARCHAR DEFAULT 'normal',
  status VARCHAR DEFAULT 'pendente',
  responsavel VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Sugestões
CREATE TABLE IF NOT EXISTS sugestoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo VARCHAR NOT NULL,
  descricao TEXT NOT NULL,
  categoria VARCHAR,
  autor VARCHAR NOT NULL,
  status VARCHAR DEFAULT 'nova',
  votos_positivos INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Erros
CREATE TABLE IF NOT EXISTS erros (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo VARCHAR NOT NULL,
  descricao TEXT NOT NULL,
  severidade VARCHAR DEFAULT 'media',
  status VARCHAR DEFAULT 'aberto',
  reportado_por VARCHAR NOT NULL,
  sistema_afetado VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Assistência Técnica
CREATE TABLE IF NOT EXISTS assistencia_tecnica (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo VARCHAR NOT NULL,
  descricao TEXT NOT NULL,
  categoria VARCHAR,
  prioridade VARCHAR DEFAULT 'normal',
  status VARCHAR DEFAULT 'ativo',
  solicitante VARCHAR NOT NULL,
  tecnico_responsavel VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS (Row Level Security) para todas as tabelas
ALTER TABLE decisoes_judiciais ENABLE ROW LEVEL SECURITY;
ALTER TABLE pendencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE sugestoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE erros ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistencia_tecnica ENABLE ROW LEVEL SECURITY;

-- Criar políticas básicas (permite todas as operações por enquanto)
-- IMPORTANTE: Ajustar as políticas de acordo com suas necessidades de segurança

CREATE POLICY "Permitir todas as operações em decisoes_judiciais" ON decisoes_judiciais FOR ALL USING (true);
CREATE POLICY "Permitir todas as operações em pendencias" ON pendencias FOR ALL USING (true);
CREATE POLICY "Permitir todas as operações em sugestoes" ON sugestoes FOR ALL USING (true);
CREATE POLICY "Permitir todas as operações em erros" ON erros FOR ALL USING (true);
CREATE POLICY "Permitir todas as operações em assistencia_tecnica" ON assistencia_tecnica FOR ALL USING (true);

-- Triggers para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_decisoes_judiciais_updated_at 
  BEFORE UPDATE ON decisoes_judiciais 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_pendencias_updated_at 
  BEFORE UPDATE ON pendencias 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_sugestoes_updated_at 
  BEFORE UPDATE ON sugestoes 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_erros_updated_at 
  BEFORE UPDATE ON erros 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_assistencia_tecnica_updated_at 
  BEFORE UPDATE ON assistencia_tecnica 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Tabela de Jurisprudências/Base de Conhecimento
CREATE TABLE IF NOT EXISTS jurisprudencias (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_processo VARCHAR,
  tribunal VARCHAR NOT NULL,
  tipo_documento VARCHAR NOT NULL, -- 'Acórdão', 'Decisão', 'Súmula', etc.
  data_julgamento DATE,
  relator VARCHAR,
  ementa TEXT NOT NULL,
  resumo TEXT,
  area_direito VARCHAR, -- 'Civil', 'Trabalhista', 'Tributário', etc.
  palavras_chave TEXT[], -- Array de palavras-chave
  tags VARCHAR[], -- Tags para categorização
  arquivo_url VARCHAR, -- URL do arquivo no Supabase Storage
  arquivo_nome VARCHAR, -- Nome original do arquivo
  conteudo_texto TEXT, -- Texto extraído do documento
  relevancia INTEGER DEFAULT 0, -- Pontuação de relevância
  status VARCHAR DEFAULT 'ativo',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS para jurisprudências
ALTER TABLE jurisprudencias ENABLE ROW LEVEL SECURITY;

-- Política para jurisprudências
CREATE POLICY "Permitir todas as operações em jurisprudencias" ON jurisprudencias FOR ALL USING (true);

-- Trigger para jurisprudências
CREATE TRIGGER update_jurisprudencias_updated_at 
  BEFORE UPDATE ON jurisprudencias 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Índices para busca eficiente
CREATE INDEX IF NOT EXISTS idx_jurisprudencias_area_direito ON jurisprudencias(area_direito);
CREATE INDEX IF NOT EXISTS idx_jurisprudencias_tribunal ON jurisprudencias(tribunal);
CREATE INDEX IF NOT EXISTS idx_jurisprudencias_data ON jurisprudencias(data_julgamento);
CREATE INDEX IF NOT EXISTS idx_jurisprudencias_palavras_chave ON jurisprudencias USING GIN(palavras_chave);

-- Inserir alguns dados de exemplo para testes
INSERT INTO decisoes_judiciais (numero_processo, tipo_decisao, conteudo_decisao, cliente) VALUES
('0001234-56.2024.8.06.0001', 'Sentença', 'Sentença de mérito favorável ao cliente.', 'Empresa ABC Ltda'),
('0001235-57.2024.8.06.0001', 'Despacho', 'Despacho determinando juntada de documentos.', 'João Silva'),
('0001236-58.2024.8.06.0001', 'Acórdão', 'Acórdão mantendo decisão de primeira instância.', 'Maria Santos');

INSERT INTO pendencias (titulo, descricao, prazo_limite, prioridade, status) VALUES
('Recurso Especial - Prazo', 'Interpor recurso especial no processo 123456', '2024-12-31', 'urgente', 'pendente'),
('Contestação - Processo Novo', 'Elaborar contestação para processo trabalhista', '2024-12-25', 'alta', 'pendente'),
('Petição Inicial - Revisão', 'Revisar petição inicial antes do protocolo', '2024-12-20', 'normal', 'pendente');

INSERT INTO sugestoes (titulo, descricao, categoria, autor) VALUES
('Sistema de Notificações', 'Implementar sistema de notificações push para prazos', 'Sistema', 'João Advogado'),
('Template de Contratos', 'Criar templates padronizados para contratos sociais', 'Documentos', 'Maria Advogada'),
('Dashboard Melhorado', 'Melhorar interface do dashboard principal', 'Interface', 'Pedro Admin');

INSERT INTO erros (titulo, descricao, severidade, reportado_por, sistema_afetado) VALUES
('Login não funciona', 'Sistema não permite login em alguns navegadores', 'alta', 'Ana Usuario', 'Sistema de Autenticação'),
('Relatório com erro', 'Relatório mensal não gera corretamente', 'media', 'Carlos Gerente', 'Sistema de Relatórios');

INSERT INTO assistencia_tecnica (titulo, descricao, categoria, prioridade, solicitante) VALUES
('Instalação Software', 'Instalar novo software de gestão processual', 'Software', 'alta', 'Departamento Legal'),
('Configuração Email', 'Configurar novo email corporativo', 'Email', 'normal', 'RH'),
('Backup Sistema', 'Verificar sistema de backup automático', 'Infraestrutura', 'alta', 'TI'),
('Treinamento Sistema', 'Agendar treinamento para novo sistema', 'Treinamento', 'normal', 'Gerência'),
('Suporte Técnico', 'Resolver problema de conectividade', 'Rede', 'normal', 'Secretaria');