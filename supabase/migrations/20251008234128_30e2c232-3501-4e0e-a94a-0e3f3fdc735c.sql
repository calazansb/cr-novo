-- =====================================================
-- SISTEMA DE GESTÃO DE OPÇÕES DE DROPDOWNS (ADMIN)
-- =====================================================

-- 1. Criar enum para tipos de ação de auditoria
CREATE TYPE public.option_audit_action AS ENUM (
  'CREATE',
  'UPDATE',
  'DELETE',
  'RESTORE',
  'ACTIVATE',
  'DEACTIVATE',
  'REORDER'
);

-- 2. Tabela de conjuntos de opções (catálogo)
CREATE TABLE public.option_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.option_sets IS 'Catálogo de grupos de opções (especialidades, departamentos, etc.)';
COMMENT ON COLUMN public.option_sets.key IS 'Chave única do conjunto (ex: especialidades, cidades)';

-- 3. Tabela de itens de opções
CREATE TABLE public.option_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  option_set_id UUID NOT NULL REFERENCES public.option_sets(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  value TEXT NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_default BOOLEAN NOT NULL DEFAULT false,
  meta JSONB DEFAULT '{}'::jsonb,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(option_set_id, value)
);

COMMENT ON TABLE public.option_items IS 'Itens individuais de cada conjunto de opções';
COMMENT ON COLUMN public.option_items.value IS 'Valor interno estável (slug)';
COMMENT ON COLUMN public.option_items."order" IS 'Ordem de exibição';
COMMENT ON COLUMN public.option_items.meta IS 'Metadados extras (ícones, cores, tags)';

-- 4. Tabela de auditoria
CREATE TABLE public.option_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  option_set_id UUID NOT NULL REFERENCES public.option_sets(id) ON DELETE CASCADE,
  option_item_id UUID REFERENCES public.option_items(id) ON DELETE SET NULL,
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action public.option_audit_action NOT NULL,
  before JSONB,
  after JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.option_audit_logs IS 'Log de auditoria de alterações nas opções';

-- 5. Tabela de versionamento
CREATE TABLE public.option_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  option_set_id UUID NOT NULL REFERENCES public.option_sets(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  snapshot JSONB NOT NULL,
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(option_set_id, version)
);

COMMENT ON TABLE public.option_versions IS 'Snapshots versionados dos conjuntos de opções';

-- 6. Índices para performance
CREATE INDEX idx_option_items_set_id ON public.option_items(option_set_id);
CREATE INDEX idx_option_items_active ON public.option_items(is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_option_items_order ON public.option_items("order");
CREATE INDEX idx_option_audit_logs_set_id ON public.option_audit_logs(option_set_id);
CREATE INDEX idx_option_audit_logs_created_at ON public.option_audit_logs(created_at);
CREATE INDEX idx_option_versions_set_id ON public.option_versions(option_set_id);

-- 7. Trigger para atualizar updated_at
CREATE TRIGGER update_option_sets_updated_at
  BEFORE UPDATE ON public.option_sets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_option_items_updated_at
  BEFORE UPDATE ON public.option_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 8. RLS Policies
ALTER TABLE public.option_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.option_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.option_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.option_versions ENABLE ROW LEVEL SECURITY;

-- Usuários autenticados podem ver option_sets
CREATE POLICY "Authenticated users can view option_sets"
  ON public.option_sets FOR SELECT
  TO authenticated
  USING (true);

-- Usuários autenticados podem ver option_items ativos
CREATE POLICY "Authenticated users can view active option_items"
  ON public.option_items FOR SELECT
  TO authenticated
  USING (is_active = true AND deleted_at IS NULL);

-- Admins podem ver todos os option_items
CREATE POLICY "Admins can view all option_items"
  ON public.option_items FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Admins podem inserir option_sets
CREATE POLICY "Admins can insert option_sets"
  ON public.option_sets FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- Admins podem atualizar option_sets
CREATE POLICY "Admins can update option_sets"
  ON public.option_sets FOR UPDATE
  TO authenticated
  USING (public.is_admin());

-- Admins podem deletar option_sets
CREATE POLICY "Admins can delete option_sets"
  ON public.option_sets FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Admins podem inserir option_items
CREATE POLICY "Admins can insert option_items"
  ON public.option_items FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- Admins podem atualizar option_items
CREATE POLICY "Admins can update option_items"
  ON public.option_items FOR UPDATE
  TO authenticated
  USING (public.is_admin());

-- Admins podem deletar option_items
CREATE POLICY "Admins can delete option_items"
  ON public.option_items FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Admins podem ver audit logs
CREATE POLICY "Admins can view audit_logs"
  ON public.option_audit_logs FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Admins podem inserir audit logs
CREATE POLICY "Admins can insert audit_logs"
  ON public.option_audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- Admins podem ver versions
CREATE POLICY "Admins can view versions"
  ON public.option_versions FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Admins podem inserir versions
CREATE POLICY "Admins can insert versions"
  ON public.option_versions FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- 9. Seed inicial com conjuntos comuns do sistema
INSERT INTO public.option_sets (key, label, description) VALUES
  ('tipo_solicitacao', 'Tipo de Solicitação', 'Tipos de solicitações para o Balcão da Controladoria'),
  ('status_solicitacao', 'Status de Solicitação', 'Status possíveis para solicitações'),
  ('tribunais', 'Tribunais', 'Tribunais e órgãos jurisdicionais'),
  ('especialidades', 'Especialidades Jurídicas', 'Áreas de especialização jurídica');

-- Seed de itens para tipo_solicitacao
INSERT INTO public.option_items (option_set_id, label, value, "order", is_active)
SELECT 
  (SELECT id FROM public.option_sets WHERE key = 'tipo_solicitacao'),
  tipo, 
  LOWER(REPLACE(tipo, ' ', '_')),
  ROW_NUMBER() OVER (ORDER BY tipo),
  true
FROM (VALUES
  ('Documentação'),
  ('Consulta Jurídica'),
  ('Revisão de Contrato'),
  ('Petição'),
  ('Recurso'),
  ('Certidões'),
  ('Análise de Processo'),
  ('Outros')
) AS tipos(tipo);

-- Seed de itens para status_solicitacao
INSERT INTO public.option_items (option_set_id, label, value, "order", is_active, is_default)
SELECT 
  (SELECT id FROM public.option_sets WHERE key = 'status_solicitacao'),
  status,
  LOWER(status),
  ROW_NUMBER() OVER (ORDER BY status),
  true,
  status = 'Pendente'
FROM (VALUES
  ('Pendente'),
  ('Em Andamento'),
  ('Concluída'),
  ('Cancelada')
) AS statuses(status);