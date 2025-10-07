// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { Clock, ArrowLeft, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TempoDetalhado {
  id: string;
  pagina: number;
  secao: string;
  tempo_inicio: string;
  tempo_fim: string;
  segundos_gastos: number;
  created_at: string;
}

interface TempoDetalhadoViewerProps {
  open: boolean;
  onClose: () => void;
  progressoId: string;
  nomeUsuario: string;
  tituloTreinamento: string;
}

const TempoDetalhadoViewer: React.FC<TempoDetalhadoViewerProps> = ({
  open,
  onClose,
  progressoId,
  nomeUsuario,
  tituloTreinamento
}) => {
  const { toast } = useToast();
  const [temposDetalhados, setTemposDetalhados] = useState<TempoDetalhado[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && progressoId) {
      loadTempoDetalhado();
    }
  }, [open, progressoId]);

  const loadTempoDetalhado = async () => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from('treinamento_tempo_detalhado')
      .select('*')
      .eq('progresso_id', progressoId)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Erro ao carregar tempo detalhado:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os detalhes de tempo.",
        variant: "destructive",
      });
    } else {
      setTemposDetalhados(data || []);
    }
    
    setLoading(false);
  };

  const calcularTempoLegivel = (segundos: number) => {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const secs = segundos % 60;
    
    if (horas > 0) {
      return `${horas}:${minutos.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutos.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const calcularEstatisticas = () => {
    if (temposDetalhados.length === 0) return null;

    const tempoTotal = temposDetalhados.reduce((acc, item) => acc + item.segundos_gastos, 0);
    const tempoMedioPorPagina = Math.round(tempoTotal / temposDetalhados.length);
    const paginaComMaisTempo = temposDetalhados.reduce((prev, current) => 
      prev.segundos_gastos > current.segundos_gastos ? prev : current
    );
    const paginaComMenosTempo = temposDetalhados.reduce((prev, current) => 
      prev.segundos_gastos < current.segundos_gastos ? prev : current
    );

    return {
      tempoTotal,
      tempoMedioPorPagina,
      paginaComMaisTempo,
      paginaComMenosTempo,
      totalPaginas: new Set(temposDetalhados.map(t => t.pagina)).size
    };
  };

  const estatisticas = calcularEstatisticas();

  const getTempoIndicator = (segundos: number) => {
    if (!estatisticas) return null;
    
    const media = estatisticas.tempoMedioPorPagina;
    
    if (segundos > media * 1.5) {
      return <TrendingUp className="h-4 w-4 text-red-500" />;
    } else if (segundos < media * 0.5) {
      return <TrendingDown className="h-4 w-4 text-green-500" />;
    }
    return <Minus className="h-4 w-4 text-gray-500" />;
  };

  const formatarDataHora = (dataIso: string) => {
    return new Date(dataIso).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Tempo Detalhado por Página
          </DialogTitle>
          <DialogDescription>
            {nomeUsuario} - {tituloTreinamento}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Estatísticas Gerais */}
            {estatisticas && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Tempo Total</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      {calcularTempoLegivel(estatisticas.tempoTotal)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Média por Página</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {calcularTempoLegivel(estatisticas.tempoMedioPorPagina)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Maior Tempo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-bold text-red-600">
                      {calcularTempoLegivel(estatisticas.paginaComMaisTempo.segundos_gastos)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Página {estatisticas.paginaComMaisTempo.pagina}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Menor Tempo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-bold text-yellow-600">
                      {calcularTempoLegivel(estatisticas.paginaComMenosTempo.segundos_gastos)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Página {estatisticas.paginaComMenosTempo.pagina}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Tabela Detalhada */}
            <Card>
              <CardHeader>
                <CardTitle>Histórico Detalhado</CardTitle>
                <CardDescription>
                  Tempo gasto em cada página durante o treinamento
                </CardDescription>
              </CardHeader>
              <CardContent>
                {temposDetalhados.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Página</TableHead>
                        <TableHead>Seção</TableHead>
                        <TableHead>Tempo Gasto</TableHead>
                        <TableHead>Indicador</TableHead>
                        <TableHead>Início</TableHead>
                        <TableHead>Fim</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {temposDetalhados.map((tempo, index) => (
                        <TableRow key={tempo.id}>
                          <TableCell className="font-medium">
                            <Badge variant="outline">
                              Página {tempo.pagina}
                            </Badge>
                          </TableCell>
                          <TableCell>{tempo.secao}</TableCell>
                          <TableCell className="font-mono">
                            {calcularTempoLegivel(tempo.segundos_gastos)}
                          </TableCell>
                          <TableCell>
                            {getTempoIndicator(tempo.segundos_gastos)}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatarDataHora(tempo.tempo_inicio)}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {tempo.tempo_fim ? formatarDataHora(tempo.tempo_fim) : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Nenhum dado de tempo detalhado encontrado.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Legenda */}
            <Card>
              <CardContent className="pt-4">
                <div className="text-sm space-y-2">
                  <p className="font-medium text-muted-foreground mb-2">Indicadores:</p>
                  <div className="flex items-center gap-6 text-xs">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-3 w-3 text-red-500" />
                      <span>Tempo acima da média (necessita atenção)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Minus className="h-3 w-3 text-gray-500" />
                      <span>Tempo normal</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingDown className="h-3 w-3 text-green-500" />
                      <span>Tempo abaixo da média (rápido)</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TempoDetalhadoViewer;