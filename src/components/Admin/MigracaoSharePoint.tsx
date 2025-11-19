import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Cloud, Database, ArrowRight, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

export const MigracaoSharePoint = () => {
  const { toast } = useToast();
  const [migrando, setMigrando] = useState(false);
  const [limite, setLimite] = useState(10);
  const [resultado, setResultado] = useState<any>(null);
  const [estatisticas, setEstatisticas] = useState<{
    total: number;
    semSharePoint: number;
  } | null>(null);

  const carregarEstatisticas = async () => {
    try {
      // Total de decisões
      const { count: total } = await supabase
        .from('decisoes_judiciais')
        .select('*', { count: 'exact', head: true });

      // Decisões sem SharePoint (antigas no bucket)
      const { count: semSharePoint } = await supabase
        .from('decisoes_judiciais')
        .select('*', { count: 'exact', head: true })
        .is('sharepoint_item_id', null)
        .not('arquivo_url', 'is', null);

      setEstatisticas({
        total: total || 0,
        semSharePoint: semSharePoint || 0,
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const iniciarMigracao = async () => {
    if (limite < 1 || limite > 100) {
      toast({
        title: "Valor inválido",
        description: "O limite deve estar entre 1 e 100",
        variant: "destructive",
      });
      return;
    }

    setMigrando(true);
    setResultado(null);

    try {
      const { data, error } = await supabase.functions.invoke('migrar-decisoes-sharepoint', {
        body: { limite },
      });

      if (error) throw error;

      setResultado(data);

      if (data.migradas > 0) {
        toast({
          title: "Migração Concluída",
          description: `${data.migradas} decisões migradas com sucesso!`,
        });
        // Atualizar estatísticas
        await carregarEstatisticas();
      } else {
        toast({
          title: "Nenhuma Decisão Migrada",
          description: data.message || "Não há decisões antigas para migrar",
        });
      }
    } catch (error) {
      console.error('Erro na migração:', error);
      toast({
        title: "Erro na Migração",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setMigrando(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            Migração para SharePoint
          </CardTitle>
          <CardDescription>
            Migre decisões antigas do Lovable Cloud Storage para o SharePoint e libere espaço
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-muted/50">
              <CardContent className="pt-6">
                <div className="text-center">
                  <Database className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p className="text-sm text-muted-foreground">Total de Decisões</p>
                  <p className="text-3xl font-bold">
                    {estatisticas ? estatisticas.total : '-'}
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-muted/50">
              <CardContent className="pt-6">
                <div className="text-center">
                  <Cloud className="h-8 w-8 mx-auto mb-2 text-orange-500" />
                  <p className="text-sm text-muted-foreground">Aguardando Migração</p>
                  <p className="text-3xl font-bold">
                    {estatisticas ? estatisticas.semSharePoint : '-'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Button
            onClick={carregarEstatisticas}
            variant="outline"
            className="w-full"
            disabled={migrando}
          >
            Atualizar Estatísticas
          </Button>

          {/* Controles de Migração */}
          <div className="space-y-4 border-t pt-6">
            <div className="space-y-2">
              <Label htmlFor="limite">
                Quantidade de Decisões por Execução (1-100)
              </Label>
              <Input
                id="limite"
                type="number"
                min={1}
                max={100}
                value={limite}
                onChange={(e) => setLimite(parseInt(e.target.value) || 10)}
                disabled={migrando}
              />
              <p className="text-sm text-muted-foreground">
                Migre em lotes pequenos para evitar timeout. Execute múltiplas vezes se necessário.
              </p>
            </div>

            <Alert>
              <AlertDescription className="text-sm">
                <strong>Processo:</strong> As decisões serão baixadas do Lovable Cloud, 
                enviadas para o SharePoint com estrutura organizada, e então deletadas do storage antigo.
              </AlertDescription>
            </Alert>

            <Button
              onClick={iniciarMigracao}
              disabled={migrando || !estatisticas || estatisticas.semSharePoint === 0}
              className="w-full"
              size="lg"
            >
              {migrando ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Migrando...
                </>
              ) : (
                <>
                  Iniciar Migração
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>

          {/* Resultados */}
          {resultado && (
            <div className="space-y-4 border-t pt-6">
              <h3 className="font-semibold">Resultado da Migração</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-green-500/10">
                  <CardContent className="pt-6 text-center">
                    <CheckCircle className="h-6 w-6 mx-auto mb-2 text-green-600" />
                    <p className="text-sm text-muted-foreground">Sucesso</p>
                    <p className="text-2xl font-bold">{resultado.migradas}</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-red-500/10">
                  <CardContent className="pt-6 text-center">
                    <XCircle className="h-6 w-6 mx-auto mb-2 text-red-600" />
                    <p className="text-sm text-muted-foreground">Erros</p>
                    <p className="text-2xl font-bold">{resultado.erros}</p>
                  </CardContent>
                </Card>
              </div>

              {resultado.detalhes && resultado.detalhes.length > 0 && (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  <h4 className="text-sm font-medium">Detalhes:</h4>
                  {resultado.detalhes.map((item: any, index: number) => (
                    <div
                      key={index}
                      className={`flex items-center gap-2 p-2 rounded text-sm ${
                        item.status === 'success'
                          ? 'bg-green-500/10 text-green-700'
                          : 'bg-red-500/10 text-red-700'
                      }`}
                    >
                      {item.status === 'success' ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <XCircle className="h-4 w-4" />
                      )}
                      <span className="font-mono">{item.codigo}</span>
                      {item.error && <span className="text-xs">- {item.error}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {estatisticas && estatisticas.semSharePoint > 0 && resultado && (
            <div className="space-y-2">
              <Label>Progresso Total</Label>
              <Progress 
                value={(1 - (estatisticas.semSharePoint / estatisticas.total)) * 100} 
              />
              <p className="text-xs text-muted-foreground text-center">
                {estatisticas.total - estatisticas.semSharePoint} de {estatisticas.total} migradas
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
