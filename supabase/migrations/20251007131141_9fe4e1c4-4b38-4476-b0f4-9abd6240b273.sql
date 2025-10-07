-- Fix search_path security warnings for trigger functions
ALTER FUNCTION public.gerar_codigo_solicitacao() SET search_path = public, pg_temp;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public, pg_temp;