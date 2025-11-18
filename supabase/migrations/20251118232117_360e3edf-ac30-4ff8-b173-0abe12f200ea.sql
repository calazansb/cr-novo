-- =====================================================
-- SISTEMA DE AUDITORIA COMPLETA - LGPD COMPLIANCE
-- =====================================================

-- 1. Criar ENUM para tipos de operação
CREATE TYPE public.audit_operation AS ENUM (
  'INSERT',
  'UPDATE', 
  'DELETE',
  'SELECT'
);

-- 2. Tabela principal de auditoria
CREATE TABLE public.audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Informações da operação
  operation public.audit_operation NOT NULL,
  table_name TEXT NOT NULL,
  record_id TEXT,
  
  -- Dados da mudança (JSON)
  old_data JSONB,
  new_data JSONB,
  changed_fields TEXT[],
  
  -- Informações do usuário
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  user_ip TEXT,
  user_agent TEXT,
  
  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  -- Metadados adicionais
  metadata JSONB
);

-- 3. Criar índices para otimizar consultas
CREATE INDEX idx_audit_logs_table_name ON public.audit_logs(table_name);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_operation ON public.audit_logs(operation);
CREATE INDEX idx_audit_logs_record_id ON public.audit_logs(record_id);

-- 4. Habilitar RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 5. Políticas RLS
-- Admins podem ver todos os logs
CREATE POLICY "Admins podem ver todos os logs de auditoria"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Usuários podem ver apenas seus próprios logs
CREATE POLICY "Usuários podem ver seus próprios logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Apenas sistema pode inserir logs (via trigger)
CREATE POLICY "Sistema pode inserir logs de auditoria"
ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 6. Função genérica de auditoria
CREATE OR REPLACE FUNCTION public.audit_trigger_function()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  audit_user_id UUID;
  audit_user_email TEXT;
  changed_fields_array TEXT[];
  old_data_json JSONB;
  new_data_json JSONB;
BEGIN
  -- Obter user_id da sessão atual
  audit_user_id := auth.uid();
  
  -- Obter email do usuário
  SELECT email INTO audit_user_email
  FROM auth.users
  WHERE id = audit_user_id;
  
  -- Preparar dados antigos e novos
  IF (TG_OP = 'DELETE') THEN
    old_data_json := to_jsonb(OLD);
    new_data_json := NULL;
  ELSIF (TG_OP = 'UPDATE') THEN
    old_data_json := to_jsonb(OLD);
    new_data_json := to_jsonb(NEW);
    
    -- Identificar campos alterados
    SELECT ARRAY_AGG(key)
    INTO changed_fields_array
    FROM (
      SELECT key
      FROM jsonb_each_text(old_data_json)
      WHERE value IS DISTINCT FROM (new_data_json->>key)
    ) AS changed;
  ELSIF (TG_OP = 'INSERT') THEN
    old_data_json := NULL;
    new_data_json := to_jsonb(NEW);
  END IF;
  
  -- Inserir log de auditoria
  INSERT INTO public.audit_logs (
    operation,
    table_name,
    record_id,
    old_data,
    new_data,
    changed_fields,
    user_id,
    user_email,
    created_at
  ) VALUES (
    TG_OP::public.audit_operation,
    TG_TABLE_NAME,
    CASE 
      WHEN TG_OP = 'DELETE' THEN (OLD.id)::TEXT
      ELSE (NEW.id)::TEXT
    END,
    old_data_json,
    new_data_json,
    changed_fields_array,
    audit_user_id,
    audit_user_email,
    NOW()
  );
  
  -- Retornar o registro apropriado
  IF (TG_OP = 'DELETE') THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- 7. Aplicar triggers nas tabelas principais
-- Decisões Judiciais
CREATE TRIGGER audit_decisoes_judiciais
AFTER INSERT OR UPDATE OR DELETE ON public.decisoes_judiciais
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- Solicitações Controladoria
CREATE TRIGGER audit_solicitacoes_controladoria
AFTER INSERT OR UPDATE OR DELETE ON public.solicitacoes_controladoria
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- Pendências
CREATE TRIGGER audit_pendencias_urgencias
AFTER INSERT OR UPDATE OR DELETE ON public.pendencias_urgencias
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- Sugestões e Erros
CREATE TRIGGER audit_sugestoes_erros
AFTER INSERT OR UPDATE OR DELETE ON public.sugestoes_erros
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- Assistência Técnica
CREATE TRIGGER audit_assistencia_tecnica
AFTER INSERT OR UPDATE OR DELETE ON public.assistencia_tecnica
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- Bloqueios Judiciais
CREATE TRIGGER audit_bloqueios_judiciais
AFTER INSERT OR UPDATE OR DELETE ON public.bloqueios_judiciais
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- Profiles (dados sensíveis - LGPD)
CREATE TRIGGER audit_profiles
AFTER INSERT OR UPDATE OR DELETE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- User Roles (mudanças de permissão são críticas)
CREATE TRIGGER audit_user_roles
AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- 8. View para relatórios agregados
CREATE OR REPLACE VIEW public.audit_summary AS
SELECT 
  table_name,
  operation,
  COUNT(*) as total_operations,
  COUNT(DISTINCT user_id) as unique_users,
  MIN(created_at) as first_operation,
  MAX(created_at) as last_operation
FROM public.audit_logs
GROUP BY table_name, operation
ORDER BY table_name, operation;

-- 9. Função para limpar logs antigos (retenção de dados)
CREATE OR REPLACE FUNCTION public.clean_old_audit_logs(retention_days INTEGER DEFAULT 365)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Apenas admins podem executar
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Apenas administradores podem limpar logs de auditoria';
  END IF;
  
  -- Deletar logs mais antigos que o período de retenção
  DELETE FROM public.audit_logs
  WHERE created_at < (NOW() - (retention_days || ' days')::INTERVAL);
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$;

-- 10. Comentários para documentação
COMMENT ON TABLE public.audit_logs IS 'Tabela de auditoria para compliance LGPD - registra todas operações no sistema';
COMMENT ON COLUMN public.audit_logs.operation IS 'Tipo de operação: INSERT, UPDATE, DELETE, SELECT';
COMMENT ON COLUMN public.audit_logs.old_data IS 'Dados antes da modificação (JSON completo)';
COMMENT ON COLUMN public.audit_logs.new_data IS 'Dados após a modificação (JSON completo)';
COMMENT ON COLUMN public.audit_logs.changed_fields IS 'Array com nomes dos campos que foram alterados';
COMMENT ON FUNCTION public.clean_old_audit_logs IS 'Remove logs mais antigos que o período de retenção especificado (padrão: 365 dias)';