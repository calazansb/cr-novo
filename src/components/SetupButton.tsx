import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Settings, CheckCircle } from 'lucide-react';

const SetupButton = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSetup = async () => {
    if (!supabase) {
      toast.error('Supabase não configurado');
      return;
    }

    setLoading(true);
    
    try {
      // Tentar criar a tabela diretamente via SQL
      const createTableSQL = `
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

      // Criar função para gerar código
      const createFunctionSQL = `
        CREATE OR REPLACE FUNCTION gerar_codigo_controladoria()
        RETURNS TEXT AS $$
        DECLARE
          data_atual DATE := CURRENT_DATE;
          ano_mes_dia TEXT := TO_CHAR(data_atual, 'YYYYMMDD');
          contador INTEGER;
          codigo_final TEXT;
        BEGIN
          SELECT COUNT(*) + 1 INTO contador
          FROM solicitacoes_controladoria
          WHERE DATE(data_criacao) = data_atual;
          
          codigo_final := 'CTRL-' || ano_mes_dia || '-' || LPAD(contador::TEXT, 4, '0');
          
          RETURN codigo_final;
        END;
        $$ LANGUAGE plpgsql;
      `;

      // Criar trigger
      const createTriggerSQL = `
        CREATE OR REPLACE FUNCTION set_codigo_controladoria()
        RETURNS TRIGGER AS $$
        BEGIN
          IF NEW.codigo_unico IS NULL OR NEW.codigo_unico = '' THEN
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

      // Habilitar RLS
      const enableRLSSQL = `
        ALTER TABLE solicitacoes_controladoria ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Permitir acesso completo para todos" ON solicitacoes_controladoria;
        CREATE POLICY "Permitir acesso completo para todos" ON solicitacoes_controladoria FOR ALL USING (true);
      `;

      // Executar via edge function
      const { data, error } = await supabase.functions.invoke('setup-controladoria', {
        body: { action: 'setup' }
      });

      if (error) {
        // Fallback: tentar inserção teste para verificar se tabela existe
        const testInsert = {
          codigo_unico: '',
          nome_solicitante: 'TESTE - DELETAR',
          cliente: 'TESTE',
          objeto_solicitacao: 'TESTE',
          descricao_detalhada: 'TESTE - PODE DELETAR'
        };

        const { error: insertError } = await supabase
          .from('solicitacoes_controladoria')
          .insert([testInsert]);

        if (insertError) {
          throw new Error(`Tabela não existe ou sem permissões: ${insertError.message}`);
        } else {
          // Deletar o registro de teste
          await supabase
            .from('solicitacoes_controladoria')
            .delete()
            .eq('nome_solicitante', 'TESTE - DELETAR');
          
          toast.success('Tabela já existe e está funcionando!');
          setSuccess(true);
        }
      } else {
        toast.success('Setup executado com sucesso!');
        setSuccess(true);
      }

    } catch (error: any) {
      console.error('Erro no setup:', error);
      
      if (error.message.includes('permission denied') || error.message.includes('insufficient_privilege')) {
        toast.error('Sem permissões para criar tabelas. Use o SQL Editor no painel do Supabase.');
      } else if (error.message.includes('does not exist')) {
        toast.error('Tabela não existe. Precisa ser criada via SQL Editor do Supabase.');
      } else {
        toast.error(`Erro: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Button variant="outline" className="text-green-600" disabled>
        <CheckCircle className="h-4 w-4 mr-2" />
        Setup Concluído
      </Button>
    );
  }

  return (
    <Button 
      onClick={handleSetup} 
      disabled={loading}
      className="bg-green-600 hover:bg-green-700"
    >
      <Settings className="h-4 w-4 mr-2" />
      {loading ? 'Configurando...' : 'Criar Tabela Controladoria'}
    </Button>
  );
};

export default SetupButton;