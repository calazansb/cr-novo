-- Corrigir função update_updated_at_column adicionando search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.data_atualizacao = NOW();
  RETURN NEW;
END;
$$;

-- Corrigir função gerar_codigo_controladoria adicionando search_path
CREATE OR REPLACE FUNCTION public.gerar_codigo_controladoria()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  data_atual DATE := CURRENT_DATE;
  ano_mes_dia TEXT := TO_CHAR(data_atual, 'YYYYMMDD');
  contador INTEGER;
  codigo_final TEXT;
BEGIN
  -- Conta quantas solicitações já existem para hoje
  SELECT COUNT(*) + 1 INTO contador
  FROM solicitacoes_controladoria
  WHERE DATE(data_criacao) = data_atual;
  
  -- Gera o código no formato CTRL-YYYYMMDD-XXXX
  codigo_final := 'CTRL-' || ano_mes_dia || '-' || LPAD(contador::TEXT, 4, '0');
  
  RETURN codigo_final;
END;
$$;

-- Corrigir função set_codigo_controladoria adicionando search_path
CREATE OR REPLACE FUNCTION public.set_codigo_controladoria()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.codigo_unico IS NULL OR NEW.codigo_unico = '' THEN
    NEW.codigo_unico := gerar_codigo_controladoria();
  END IF;
  RETURN NEW;
END;
$$;

-- Corrigir função update_updated_at_treinamentos adicionando search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_treinamentos()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Corrigir função atualizar_tempo_total_progresso adicionando search_path
CREATE OR REPLACE FUNCTION public.atualizar_tempo_total_progresso()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;