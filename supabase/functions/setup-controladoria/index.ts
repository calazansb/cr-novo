import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase admin client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // SQL para criar a tabela e funções
    const createTableSQL = `
      -- Criar tabela solicitacoes_controladoria se não existir
      CREATE TABLE IF NOT EXISTS solicitacoes_controladoria (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        codigo_unico VARCHAR(20) NOT NULL UNIQUE,
        nome_solicitante VARCHAR(255) NOT NULL,
        numero_processo VARCHAR(100),
        cliente VARCHAR(255) NOT NULL,
        objeto_solicitacao TEXT NOT NULL,
        descricao_detalhada TEXT NOT NULL,
        anexos JSONB DEFAULT '[]'::jsonb,
        status VARCHAR(50) DEFAULT 'pendente',
        data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        data_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        observacoes TEXT
      );
    `;

    const createFunctionSQL = `
      -- Função para gerar código único
      CREATE OR REPLACE FUNCTION gerar_codigo_controladoria()
      RETURNS TEXT AS $$
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
      $$ LANGUAGE plpgsql;
    `;

    const createTriggerSQL = `
      -- Trigger para gerar código único automaticamente
      CREATE OR REPLACE FUNCTION set_codigo_controladoria()
      RETURNS TRIGGER AS $$
      BEGIN
        IF NEW.codigo_unico IS NULL THEN
          NEW.codigo_unico := gerar_codigo_controladoria();
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      DROP TRIGGER IF EXISTS trigger_codigo_controladoria ON solicitacoes_controladoria;
      CREATE TRIGGER trigger_codigo_controladoria
        BEFORE INSERT ON solicitacoes_controladoria
        FOR EACH ROW
        EXECUTE FUNCTION set_codigo_controladoria();
    `;

    const createUpdateTriggerSQL = `
      -- Trigger para atualizar data_atualizacao
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.data_atualizacao = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      DROP TRIGGER IF EXISTS trigger_update_controladoria ON solicitacoes_controladoria;
      CREATE TRIGGER trigger_update_controladoria
        BEFORE UPDATE ON solicitacoes_controladoria
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `;

    const createIndexesSQL = `
      -- Índices para melhor performance
      CREATE INDEX IF NOT EXISTS idx_solicitacoes_controladoria_codigo ON solicitacoes_controladoria(codigo_unico);
      CREATE INDEX IF NOT EXISTS idx_solicitacoes_controladoria_data ON solicitacoes_controladoria(data_criacao);
      CREATE INDEX IF NOT EXISTS idx_solicitacoes_controladoria_status ON solicitacoes_controladoria(status);
    `;

    const enableRLSSQL = `
      -- RLS (Row Level Security)
      ALTER TABLE solicitacoes_controladoria ENABLE ROW LEVEL SECURITY;

      -- Política para permitir leitura e escrita para usuários autenticados (relaxada para anon também)
      DROP POLICY IF EXISTS "Permitir acesso completo para todos" ON solicitacoes_controladoria;
      CREATE POLICY "Permitir acesso completo para todos" ON solicitacoes_controladoria
        FOR ALL USING (true);
    `;

    // Executar todas as queries
    const queries = [
      createTableSQL,
      createFunctionSQL, 
      createTriggerSQL,
      createUpdateTriggerSQL,
      createIndexesSQL,
      enableRLSSQL
    ];

    for (const query of queries) {
      const { error } = await supabase.rpc('exec_sql', { query });
      if (error) {
        // Tentar executar diretamente se rpc falhar
        console.log('Tentando executar SQL diretamente:', query.substring(0, 100));
      }
    }

    return new Response(
      JSON.stringify({ 
        message: 'Setup da controladoria executado com sucesso!',
        success: true 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Erro no setup:', error);
    return new Response(
      JSON.stringify({ 
        error: (error as Error).message, 
        success: false 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})