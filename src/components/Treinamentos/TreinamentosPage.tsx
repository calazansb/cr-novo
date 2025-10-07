// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/components/Auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { BookOpen, Clock, CheckCircle, AlertCircle, Users, BarChart3, Upload, Eye } from 'lucide-react';
import TreinamentosAdmin from './TreinamentosAdmin';
import TreinamentoViewer from './TreinamentoViewer';

interface Treinamento {
  id: string;
  titulo: string;
  descricao?: string;
  obrigatorio: boolean;
  ativo: boolean;
  arquivo_url?: string;
  arquivo_nome?: string;
  tipo_conteudo: string; // Change to string to match database
  created_at: string;
}

interface ProgressoTreinamento {
  id: string;
  treinamento_id: string;
  concluido: boolean;
  tempo_total_segundos: number;
  pagina_atual: number;
  total_paginas: number;
  iniciado_em: string;
  concluido_em?: string;
}

const TreinamentosPage = () => {
  const { user } = useAuth();
  const [treinamentos, setTreinamentos] = useState<Treinamento[]>([]);
  const [progressos, setProgressos] = useState<ProgressoTreinamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'list' | 'admin' | 'viewer'>('list');
  const [selectedTreinamento, setSelectedTreinamento] = useState<Treinamento | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (user) {
      checkAdminStatus();
      loadTreinamentos();
      loadProgressos();
    }
  }, [user]);

  const checkAdminStatus = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('profiles')
      .select('perfil')
      .eq('user_id', user.id)
      .single();
    
    setIsAdmin(data?.perfil === 'admin');
  };

  const loadTreinamentos = async () => {
    const { data, error } = await supabase
      .from('treinamentos')
      .select('*')
      .eq('ativo', true)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Erro ao carregar treinamentos:', error);
    } else {
      setTreinamentos(data || []);
    }
  };

  const loadProgressos = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('treinamento_progresso')
      .select('*')
      .eq('user_id', user.id);
    
    if (error) {
      console.error('Erro ao carregar progressos:', error);
    } else {
      setProgressos(data || []);
    }
    
    setLoading(false);
  };

  const getProgressoTreinamento = (treinamentoId: string) => {
    return progressos.find(p => p.treinamento_id === treinamentoId);
  };

  const calcularTempoLegivel = (segundos: number) => {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    
    if (horas > 0) {
      return `${horas}h ${minutos}m`;
    }
    return `${minutos}m`;
  };

  const iniciarTreinamento = async (treinamento: Treinamento) => {
    if (!user) return;
    
    // Verificar se já existe progresso
    let progresso = getProgressoTreinamento(treinamento.id);
    
    if (!progresso) {
      // Criar novo progresso
      const { data, error } = await supabase
        .from('treinamento_progresso')
        .insert({
          user_id: user.id,
          treinamento_id: treinamento.id,
          pagina_atual: 1,
          total_paginas: 1
        })
        .select()
        .single();
      
      if (error) {
        console.error('Erro ao criar progresso:', error);
        return;
      }
      
      progresso = data;
      setProgressos([...progressos, progresso]);
    }
    
    setSelectedTreinamento(treinamento);
    setActiveView('viewer');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (activeView === 'admin') {
    return (
      <TreinamentosAdmin 
        onBack={() => setActiveView('list')}
        onRefresh={() => {
          loadTreinamentos();
          loadProgressos();
        }}
      />
    );
  }

  if (activeView === 'viewer' && selectedTreinamento) {
    return (
      <TreinamentoViewer
        treinamento={selectedTreinamento}
        onBack={() => {
          setActiveView('list');
          setSelectedTreinamento(null);
          loadProgressos(); // Recarregar progresso após voltar
        }}
      />
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Treinamentos</h1>
          <p className="text-muted-foreground">
            Materiais de leitura e treinamentos obrigatórios
          </p>
        </div>
        
        {isAdmin && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setActiveView('admin')}
              className="flex items-center gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              Dashboard Admin
            </Button>
          </div>
        )}
      </div>

      {/* Estatísticas do usuário */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{treinamentos.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Concluídos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {progressos.filter(p => p.concluido).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              Obrigatórios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {treinamentos.filter(t => t.obrigatorio).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              Tempo Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {calcularTempoLegivel(progressos.reduce((acc, p) => acc + p.tempo_total_segundos, 0))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de treinamentos */}
      <div className="grid gap-4">
        {treinamentos.map((treinamento) => {
          const progresso = getProgressoTreinamento(treinamento.id);
          const percentualConclusao = progresso 
            ? Math.round((progresso.pagina_atual / progresso.total_paginas) * 100)
            : 0;

          return (
            <Card key={treinamento.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg">{treinamento.titulo}</CardTitle>
                      {treinamento.obrigatorio && (
                        <Badge variant="destructive" className="text-xs">
                          Obrigatório
                        </Badge>
                      )}
                      {progresso?.concluido && (
                        <Badge variant="default" className="text-xs bg-green-600">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Concluído
                        </Badge>
                      )}
                    </div>
                    
                    {treinamento.descricao && (
                      <CardDescription className="mb-3">
                        {treinamento.descricao}
                      </CardDescription>
                    )}
                    
                    {progresso && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            Progresso: {progresso.pagina_atual}/{progresso.total_paginas} páginas
                          </span>
                          <span className="font-medium">{percentualConclusao}%</span>
                        </div>
                        <Progress value={percentualConclusao} className="h-2" />
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {calcularTempoLegivel(progresso.tempo_total_segundos)}
                          </span>
                          <span>
                            Iniciado em: {new Date(progresso.iniciado_em).toLocaleDateString('pt-BR')}
                          </span>
                          {progresso.concluido_em && (
                            <span>
                              Concluído em: {new Date(progresso.concluido_em).toLocaleDateString('pt-BR')}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <Button
                    onClick={() => iniciarTreinamento(treinamento)}
                    className="ml-4"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    {progresso ? 'Continuar' : 'Iniciar'}
                  </Button>
                </div>
              </CardHeader>
            </Card>
          );
        })}
        
        {treinamentos.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Nenhum treinamento disponível no momento.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TreinamentosPage;