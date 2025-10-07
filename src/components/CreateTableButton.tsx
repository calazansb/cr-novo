import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Copy, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

const CreateTableButton = () => {
  const [showSQL, setShowSQL] = useState(false);

  const sqlCode = `-- SQL para criar a tabela do Balcão da Controladoria
-- Cole este código no SQL Editor do seu Supabase

-- Habilitar extensão necessária para UUID
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Tabela para armazenar solicitações do Balcão da Controladoria
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

-- Função para gerar código único no formato CTRL-YYYYMMDD-XXXX
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

-- Trigger para gerar código único automaticamente
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

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_solicitacoes_controladoria_codigo ON solicitacoes_controladoria(codigo_unico);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_controladoria_data ON solicitacoes_controladoria(data_criacao);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_controladoria_status ON solicitacoes_controladoria(status);

-- RLS (Row Level Security)
ALTER TABLE solicitacoes_controladoria ENABLE ROW LEVEL SECURITY;

-- Política para permitir acesso completo (pode ajustar depois se necessário)
DROP POLICY IF EXISTS "Permitir acesso completo para todos" ON solicitacoes_controladoria;
CREATE POLICY "Permitir acesso completo para todos" ON solicitacoes_controladoria
  FOR ALL USING (true);

-- Mensagem de sucesso
SELECT 'Tabela solicitacoes_controladoria criada com sucesso!' as resultado;`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sqlCode);
    toast.success('SQL copiado para a área de transferência!');
  };

  const openSupabase = () => {
    window.open('https://app.supabase.com/project/yqeufugteljrmvlvfpcd/editor/sql', '_blank');
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button onClick={() => setShowSQL(!showSQL)} variant="outline">
          {showSQL ? 'Ocultar' : 'Mostrar'} SQL da Tabela
        </Button>
        <Button onClick={openSupabase} className="flex items-center gap-2">
          <ExternalLink className="h-4 w-4" />
          Abrir SQL Editor do Supabase
        </Button>
      </div>

      {showSQL && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium">SQL para criar a tabela:</h3>
              <Button onClick={copyToClipboard} size="sm" variant="outline">
                <Copy className="h-4 w-4 mr-2" />
                Copiar SQL
              </Button>
            </div>
            <pre className="bg-slate-100 p-3 rounded text-xs overflow-x-auto max-h-96 overflow-y-auto">
              <code>{sqlCode}</code>
            </pre>
            <div className="mt-3 text-sm text-muted-foreground">
              <strong>Como usar:</strong>
              <ol className="list-decimal list-inside mt-1 space-y-1">
                <li>Copie o SQL acima</li>
                <li>Clique em "Abrir SQL Editor do Supabase"</li>
                <li>Cole o código na área do editor</li>
                <li>Clique em "Run" para executar</li>
                <li>Volte aqui e teste uma nova solicitação!</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CreateTableButton;