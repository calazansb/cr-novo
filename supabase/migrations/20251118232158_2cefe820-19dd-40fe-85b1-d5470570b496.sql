-- Recriar view audit_summary sem SECURITY DEFINER
DROP VIEW IF EXISTS public.audit_summary;

CREATE VIEW public.audit_summary AS
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