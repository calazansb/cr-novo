import { useState } from 'react';
import { Database, ExternalLink, Copy, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const DatabaseSetupNotice = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const sqlScript = `-- Script SQL para criar tabelas necessárias no Supabase
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

-- Habilitar RLS (Row Level Security)
ALTER TABLE decisoes_judiciais ENABLE ROW LEVEL SECURITY;
ALTER TABLE pendencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE sugestoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE erros ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistencia_tecnica ENABLE ROW LEVEL SECURITY;

-- Criar políticas básicas
CREATE POLICY "Permitir todas as operações em decisoes_judiciais" ON decisoes_judiciais FOR ALL USING (true);
CREATE POLICY "Permitir todas as operações em pendencias" ON pendencias FOR ALL USING (true);
CREATE POLICY "Permitir todas as operações em sugestoes" ON sugestoes FOR ALL USING (true);
CREATE POLICY "Permitir todas as operações em erros" ON erros FOR ALL USING (true);
CREATE POLICY "Permitir todas as operações em assistencia_tecnica" ON assistencia_tecnica FOR ALL USING (true);`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(sqlScript);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Erro ao copiar:', err);
    }
  };

  return (
    <Card className="border-warning/50 bg-gradient-to-br from-warning/5 to-transparent">
      <CardHeader>
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-warning/10 rounded-lg">
            <Database className="w-5 h-5 text-warning" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold text-foreground">
              Configuração do Banco de Dados
            </CardTitle>
            <CardDescription>
              Para exibir dados reais, configure as tabelas necessárias no Supabase
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Algumas tabelas ainda não foram criadas no seu banco de dados. 
            Execute o script SQL abaixo no Supabase para habilitar todas as funcionalidades.
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-foreground">Passos para configurar:</h4>
          </div>
          
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center space-x-2">
              <span className="flex-shrink-0 w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">1</span>
              <span>Acesse seu dashboard do Supabase</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="flex-shrink-0 w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">2</span>
              <span>Vá para SQL Editor</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="flex-shrink-0 w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">3</span>
              <span>Execute o script SQL abaixo</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="flex-shrink-0 w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">4</span>
              <span>Recarregue esta página</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => window.open('https://supabase.com/dashboard', '_blank')}
            className="flex-1"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Abrir Supabase Dashboard
          </Button>
          
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <CollapsibleTrigger asChild>
              <Button variant="outline">
                {isExpanded ? 'Ocultar' : 'Ver'} Script SQL
              </Button>
            </CollapsibleTrigger>
          </Collapsible>
        </div>

        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleContent className="space-y-3">
            <div className="relative">
              <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto max-h-64 border">
                <code>{sqlScript}</code>
              </pre>
              
              <Button
                variant="outline"
                size="sm"
                className="absolute top-2 right-2"
                onClick={copyToClipboard}
              >
                {copied ? (
                  <>
                    <CheckCircle className="w-3 h-3 mr-1 text-success" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 mr-1" />
                    Copiar
                  </>
                )}
              </Button>
            </div>
            
            <Alert>
              <AlertDescription className="text-xs">
                💡 <strong>Dica:</strong> Após executar o script, o sistema populará automaticamente 
                as estatísticas com dados reais das suas tabelas.
              </AlertDescription>
            </Alert>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
};

export default DatabaseSetupNotice;