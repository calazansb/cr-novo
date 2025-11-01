import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Scale, TrendingUp, FileText, BookOpen } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface PerfilMagistradoProps {
  nomeMagistrado: string;
  onBack: () => void;
}

const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

const PerfilMagistrado: React.FC<PerfilMagistradoProps> = ({ nomeMagistrado, onBack }) => {
  const magistradoNome = nomeMagistrado;
  const [decisoes, setDecisoes] = useState<any[]>([]);
  const [analises, setAnalises] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarDadosMagistrado();
  }, [magistradoNome]);

  const carregarDadosMagistrado = async () => {
    setLoading(true);
    try {
      // Carregar decisões do magistrado
      const { data: decisoesData, error: decisoesError } = await supabase
        .from('decisoes_judiciais')
        .select('*')
        .eq('nome_magistrado', magistradoNome);

      if (decisoesError) throw decisoesError;
      setDecisoes(decisoesData || []);

      // Carregar análises das decisões
      if (decisoesData && decisoesData.length > 0) {
        const decisaoIds = decisoesData.map(d => d.id);
        const { data: analisesData, error: analisesError } = await supabase
          .from('analises_decisoes')
          .select('*')
          .in('decisao_id', decisaoIds);

        if (!analisesError) {
          setAnalises(analisesData || []);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados do magistrado:', error);
    } finally {
      setLoading(false);
    }
  };

  // Estatísticas de decisão
  const estatisticas = useMemo(() => {
    const total = decisoes.length;
    const favoraveis = decisoes.filter(d => d.resultado === 'Favorável').length;
    const parciais = decisoes.filter(d => d.resultado === 'Parcialmente Favorável').length;
    const desfavoraveis = decisoes.filter(d => d.resultado === 'Desfavorável').length;

    return {
      total,
      favoraveis,
      parciais,
      desfavoraveis,
      taxaSucesso: total > 0 ? ((favoraveis + parciais * 0.5) / total * 100).toFixed(1) : 0
    };
  }, [decisoes]);

  // Temas mais julgados
  const temasRecorrentes = useMemo(() => {
    const contagem: { [key: string]: number } = {};
    decisoes.forEach(d => {
      const tema = d.procedimento_objeto || 'Não especificado';
      contagem[tema] = (contagem[tema] || 0) + 1;
    });

    return Object.entries(contagem)
      .map(([tema, count]) => ({ tema, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [decisoes]);

  // Doutrinas mais citadas
  const doutrinasPreferenciais = useMemo(() => {
    const contagem: { [key: string]: number } = {};
    
    analises.forEach(analise => {
      if (analise.doutrinas_citadas && Array.isArray(analise.doutrinas_citadas)) {
        analise.doutrinas_citadas.forEach((doutrina: any) => {
          const nome = doutrina.doutrinador || 'Desconhecido';
          contagem[nome] = (contagem[nome] || 0) + 1;
        });
      }
    });

    return Object.entries(contagem)
      .map(([doutrinador, count]) => ({ doutrinador, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [analises]);

  // Precedentes mais utilizados
  const precedentesMaisUsados = useMemo(() => {
    const contagem: { [key: string]: number } = {};
    
    analises.forEach(analise => {
      if (analise.julgados_citados && Array.isArray(analise.julgados_citados)) {
        analise.julgados_citados.forEach((julgado: any) => {
          const chave = `${julgado.tribunal} - ${julgado.numero_processo}`;
          contagem[chave] = (contagem[chave] || 0) + 1;
        });
      }
    });

    return Object.entries(contagem)
      .map(([precedente, count]) => ({ precedente, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [analises]);

  // Termos mais frequentes (nuvem de palavras)
  const termosFrequentes = useMemo(() => {
    const contagem: { [key: string]: number } = {};
    
    analises.forEach(analise => {
      if (analise.termos_frequentes && Array.isArray(analise.termos_frequentes)) {
        analise.termos_frequentes.forEach((item: any) => {
          const termo = item.termo || '';
          const freq = item.frequencia || 1;
          contagem[termo] = (contagem[termo] || 0) + freq;
        });
      }
    });

    return Object.entries(contagem)
      .map(([termo, count]) => ({ termo, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 30);
  }, [analises]);

  const dadosGraficoPizza = [
    { name: 'Favorável', value: estatisticas.favoraveis },
    { name: 'Parcial', value: estatisticas.parciais },
    { name: 'Desfavorável', value: estatisticas.desfavoraveis }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando perfil do magistrado...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Scale className="h-8 w-8" />
            {magistradoNome}
          </h1>
          <p className="text-muted-foreground">Perfil de Jurimetria</p>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Decisões</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estatisticas.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{estatisticas.taxaSucesso}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Temas Julgados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{temasRecorrentes.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Doutrinas Citadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{doutrinasPreferenciais.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Resultados</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dadosGraficoPizza}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {dadosGraficoPizza.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top 10 Temas Recorrentes</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={temasRecorrentes}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="tema" angle={-45} textAnchor="end" height={100} fontSize={10} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#0088FE" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Listas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Doutrinadores Mais Citados
            </CardTitle>
            <CardDescription>Top 10 autores referenciados nas decisões</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {doutrinasPreferenciais.length > 0 ? (
                doutrinasPreferenciais.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                    <span className="text-sm">{item.doutrinador}</span>
                    <Badge variant="secondary">{item.count}x</Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Nenhuma doutrina analisada ainda</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Precedentes Mais Utilizados
            </CardTitle>
            <CardDescription>Top 10 julgados citados como referência</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {precedentesMaisUsados.length > 0 ? (
                precedentesMaisUsados.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                    <span className="text-sm truncate">{item.precedente}</span>
                    <Badge variant="secondary">{item.count}x</Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum precedente analisado ainda</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Nuvem de Palavras */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Termos Mais Frequentes
          </CardTitle>
          <CardDescription>Palavras-chave mais utilizadas nas decisões</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {termosFrequentes.length > 0 ? (
              termosFrequentes.map((item, index) => (
                <Badge 
                  key={index} 
                  variant="outline"
                  className="text-sm"
                  style={{ 
                    fontSize: `${Math.min(8 + item.count / 2, 16)}px`,
                    opacity: Math.max(0.5, Math.min(item.count / 20, 1))
                  }}
                >
                  {item.termo} ({item.count})
                </Badge>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum termo analisado ainda</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PerfilMagistrado;
