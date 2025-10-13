-- Criar tabela para bloqueios judiciais
CREATE TABLE public.bloqueios_judiciais (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo_unico VARCHAR(50) NOT NULL UNIQUE,
  numero_processo VARCHAR(100) NOT NULL,
  orgao VARCHAR(100) NOT NULL,
  tipo_bloqueio VARCHAR(100) NOT NULL,
  valor_bloqueado DECIMAL(15, 2),
  data_bloqueio DATE NOT NULL,
  instituicao_financeira VARCHAR(200),
  agencia VARCHAR(50),
  conta VARCHAR(50),
  responsavel VARCHAR(100) NOT NULL,
  cliente VARCHAR(100) NOT NULL,
  descricao TEXT NOT NULL,
  observacoes TEXT,
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.bloqueios_judiciais ENABLE ROW LEVEL SECURITY;

-- Create policies for bloqueios_judiciais
CREATE POLICY "Usuários autenticados podem criar bloqueios" 
ON public.bloqueios_judiciais 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários autenticados podem ver bloqueios" 
ON public.bloqueios_judiciais 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários podem atualizar seus bloqueios" 
ON public.bloqueios_judiciais 
FOR UPDATE 
USING ((auth.uid() = user_id) OR is_admin());

CREATE POLICY "Admins podem deletar bloqueios" 
ON public.bloqueios_judiciais 
FOR DELETE 
USING (is_admin());

-- Create function to generate unique code for bloqueios
CREATE OR REPLACE FUNCTION public.gerar_codigo_bloqueio()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  novo_codigo VARCHAR(50);
  contador INTEGER := 1;
BEGIN
  LOOP
    novo_codigo := 'BLOQ-' || TO_CHAR(NOW(), 'DD-MM-YYYY') || '-' || LPAD(contador::TEXT, 4, '0');
    IF NOT EXISTS (SELECT 1 FROM public.bloqueios_judiciais WHERE codigo_unico = novo_codigo) THEN
      NEW.codigo_unico := novo_codigo;
      EXIT;
    END IF;
    contador := contador + 1;
  END LOOP;
  RETURN NEW;
END;
$function$;

-- Create trigger for automatic code generation
CREATE TRIGGER trigger_gerar_codigo_bloqueio
BEFORE INSERT ON public.bloqueios_judiciais
FOR EACH ROW
WHEN (NEW.codigo_unico IS NULL OR NEW.codigo_unico = '')
EXECUTE FUNCTION public.gerar_codigo_bloqueio();

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_bloqueios_judiciais_updated_at
BEFORE UPDATE ON public.bloqueios_judiciais
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();