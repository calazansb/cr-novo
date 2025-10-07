// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/components/Auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, ChevronLeft, ChevronRight, CheckCircle, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Treinamento {
  id: string;
  titulo: string;
  descricao?: string;
  arquivo_url?: string;
  tipo_conteudo: string; // Change to string to match database
}

interface TreinamentoViewerProps {
  treinamento: Treinamento;
  onBack: () => void;
}

const TreinamentoViewer: React.FC<TreinamentoViewerProps> = ({ treinamento, onBack }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [progresso, setProgresso] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [startTime, setStartTime] = useState<Date>(new Date());
  const [tempoGastoAtual, setTempoGastoAtual] = useState(0);

  useEffect(() => {
    if (user) {
      loadProgresso();
    }

    // Timer para rastrear tempo na página atual
    const timer = setInterval(() => {
      setTempoGastoAtual(prev => prev + 1);
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [user, treinamento.id]);

  // Efeito separado para salvar tempo ao trocar de página ou sair
  useEffect(() => {
    return () => {
      // Salvar tempo gasto na página ao sair do componente ou trocar página
      if (progresso && tempoGastoAtual > 0) {
        salvarTempoDetalhado();
      }
    };
  }, [currentPage, progresso]);

  useEffect(() => {
    // Reiniciar timer quando mudar de página
    setStartTime(new Date());
    setTempoGastoAtual(0);
  }, [currentPage]);

  const loadProgresso = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('treinamento_progresso')
      .select('*')
      .eq('user_id', user.id)
      .eq('treinamento_id', treinamento.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Erro ao carregar progresso:', error);
    } else if (data) {
      setProgresso(data);
      setCurrentPage(data.pagina_atual);
      setTotalPages(data.total_paginas);
    }
  };

  const salvarTempoDetalhado = async () => {
    if (!progresso || tempoGastoAtual <= 5) return; // Só salva se passou pelo menos 5 segundos

    const tempoFim = new Date();
    const segundosGastos = Math.max(tempoGastoAtual, Math.floor((tempoFim.getTime() - startTime.getTime()) / 1000));

    try {
      const { error } = await supabase
        .from('treinamento_tempo_detalhado')
        .insert({
          progresso_id: progresso.id,
          pagina: currentPage,
          secao: `Página ${currentPage}`,
          tempo_inicio: startTime.toISOString(),
          tempo_fim: tempoFim.toISOString(),
          segundos_gastos: segundosGastos
        });

      if (error) {
        console.error('Erro ao salvar tempo detalhado:', error);
      } else {
        console.log(`Tempo salvo: ${segundosGastos}s na página ${currentPage}`);
      }
    } catch (err) {
      console.error('Erro ao salvar tempo detalhado:', err);
    }
  };

  const atualizarProgresso = async (novaPagina: number, concluido: boolean = false) => {
    if (!progresso || !user) return;

    const { error } = await supabase
      .from('treinamento_progresso')
      .update({
        pagina_atual: novaPagina,
        concluido,
        concluido_em: concluido ? new Date().toISOString() : null
      })
      .eq('id', progresso.id);

    if (error) {
      console.error('Erro ao atualizar progresso:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o progresso.",
        variant: "destructive",
      });
    } else {
      setProgresso({ ...progresso, pagina_atual: novaPagina, concluido });
      if (concluido) {
        toast({
          title: "Parabéns!",
          description: "Treinamento concluído com sucesso!",
        });
      }
    }
  };

  const nextPage = async () => {
    if (currentPage < totalPages) {
      // Salvar tempo da página atual
      await salvarTempoDetalhado();
      
      const novaPagina = currentPage + 1;
      setCurrentPage(novaPagina);
      
      // Resetar timer para nova página
      setStartTime(new Date());
      setTempoGastoAtual(0);
      
      atualizarProgresso(novaPagina, novaPagina === totalPages);
    }
  };

  const prevPage = async () => {
    if (currentPage > 1) {
      // Salvar tempo da página atual
      await salvarTempoDetalhado();
      
      const novaPagina = currentPage - 1;
      setCurrentPage(novaPagina);
      
      // Resetar timer para nova página
      setStartTime(new Date());
      setTempoGastoAtual(0);
      
      atualizarProgresso(novaPagina);
    }
  };

  const marcarComoConcluido = async () => {
    // Salvar tempo da página final
    await salvarTempoDetalhado();
    atualizarProgresso(totalPages, true);
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

  const percentualConclusao = Math.round((currentPage / totalPages) * 100);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{treinamento.titulo}</h1>
          {treinamento.descricao && (
            <p className="text-muted-foreground">{treinamento.descricao}</p>
          )}
        </div>
      </div>

      {/* Barra de progresso e controles */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Progresso do Treinamento</CardTitle>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Tempo na página: {calcularTempoLegivel(tempoGastoAtual)}
              </span>
              {progresso?.concluido && (
                <span className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  Concluído
                </span>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span>Página {currentPage} de {totalPages}</span>
            <span className="font-medium">{percentualConclusao}%</span>
          </div>
          <Progress value={percentualConclusao} className="h-3" />
          
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={prevPage}
              disabled={currentPage <= 1}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Página Anterior
            </Button>
            
            <div className="flex gap-2">
              {currentPage === totalPages && !progresso?.concluido && (
                <Button onClick={marcarComoConcluido} className="bg-green-600 hover:bg-green-700">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Marcar como Concluído
                </Button>
              )}
              
              <Button
                onClick={nextPage}
                disabled={currentPage >= totalPages}
                className="flex items-center gap-2"
              >
                Próxima Página
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conteúdo do treinamento */}
      <Card className="min-h-[500px]">
        <CardContent className="p-8">
          {treinamento.tipo_conteudo === 'pdf' && treinamento.arquivo_url && (
            <div className="w-full h-[600px]">
              <iframe
                src={`${treinamento.arquivo_url}#page=${currentPage}`}
                className="w-full h-full border rounded-lg"
                title={treinamento.titulo}
              />
            </div>
          )}
          
          {treinamento.tipo_conteudo === 'link' && treinamento.arquivo_url && (
            <div className="w-full h-[600px]">
              <iframe
                src={treinamento.arquivo_url}
                className="w-full h-full border rounded-lg"
                title={treinamento.titulo}
              />
            </div>
          )}
          
          {treinamento.tipo_conteudo === 'video' && treinamento.arquivo_url && (
            <div className="w-full">
              <video
                controls
                className="w-full max-h-[500px] rounded-lg"
                src={treinamento.arquivo_url}
              >
                Seu navegador não suporta o elemento de vídeo.
              </video>
            </div>
          )}
          
          {treinamento.tipo_conteudo === 'texto' && (
            <div className="prose max-w-none">
              <div className="bg-muted p-8 rounded-lg">
                <h2 className="text-xl font-semibold mb-4">Página {currentPage}</h2>
                {treinamento.descricao && (
                  <div className="text-muted-foreground leading-relaxed">
                    {treinamento.descricao}
                  </div>
                )}
                {!treinamento.arquivo_url && !treinamento.descricao && (
                  <p className="text-muted-foreground text-center py-8">
                    Conteúdo não disponível para esta página.
                  </p>
                )}
              </div>
            </div>
          )}
          
          {!treinamento.arquivo_url && treinamento.tipo_conteudo !== 'texto' && (
            <div className="text-center py-16">
              <p className="text-muted-foreground">
                Nenhum conteúdo foi configurado para este treinamento ainda.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TreinamentoViewer;