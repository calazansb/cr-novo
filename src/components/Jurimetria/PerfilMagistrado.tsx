import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Scale, TrendingUp, FileText, BookOpen, Copy, Database, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface PerfilMagistradoProps {
  nomeMagistrado: string;
  onBack: () => void;
}

const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

const PerfilMagistrado: React.FC<PerfilMagistradoProps> = ({ nomeMagistrado, onBack }) => {
  const magistradoNome = nomeMagistrado;
  const navigate = useNavigate();
  const [decisoes, setDecisoes] = useState<any[]>([]);
  const [analises, setAnalises] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const copiarTexto = async (texto: string, tipo: string) => {
    try {
      await navigator.clipboard.writeText(texto);
      toast.success(`${tipo} copiado!`);
    } catch (error) {
      toast.error('Erro ao copiar');
    }
  };

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

  // Doutrinas citadas - agora com citação completa
  const doutrinasPreferenciais = useMemo(() => {
    const citacoesCompletas: string[] = [];
    analises.forEach(analise => {
      if (analise.doutrinas_citadas && Array.isArray(analise.doutrinas_citadas)) {
        analise.doutrinas_citadas.forEach((doutrina: any) => {
          const citacao = typeof doutrina === 'string' ? doutrina.trim() : '';
          if (citacao && citacao.length > 10) {
            citacoesCompletas.push(citacao);
          }
        });
      }
    });
    return citacoesCompletas;
  }, [analises]);

  // Precedentes citados - agora com citação completa
  const precedentesMaisUsados = useMemo(() => {
    const citacoesCompletas: string[] = [];
    analises.forEach(analise => {
      if (analise.julgados_citados && Array.isArray(analise.julgados_citados)) {
        analise.julgados_citados.forEach((julgado: any) => {
          const citacao = typeof julgado === 'string' ? julgado.trim() : '';
          if (citacao && citacao.length > 10) {
            citacoesCompletas.push(citacao);
          }
        });
      }
    });
    return citacoesCompletas;
  }, [analises]);

  const normasLegaisCitadas = useMemo(() => {
    const normasPorTipo: { [tipo: string]: { [nome: string]: Set<string> } } = {};
    
    analises.forEach(analise => {
      if (analise.termos_frequentes && Array.isArray(analise.termos_frequentes)) {
        analise.termos_frequentes.forEach((item: any) => {
          if (typeof item === 'object' && item.tipo && item.nome) {
            const tipo = item.tipo;
            const nome = item.nome;
            
            if (!normasPorTipo[tipo]) {
              normasPorTipo[tipo] = {};
            }
            if (!normasPorTipo[tipo][nome]) {
              normasPorTipo[tipo][nome] = new Set();
            }
            
            if (item.artigos && Array.isArray(item.artigos)) {
              item.artigos.forEach((art: string) => {
                normasPorTipo[tipo][nome].add(art);
              });
            }
          }
        });
      }
    });

    return Object.entries(normasPorTipo).map(([tipo, normas]) => ({
      tipo,
      normas: Object.entries(normas).map(([nome, artigos]) => ({
        nome,
        artigos: Array.from(artigos)
      }))
    }));
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
      <div className="flex items-center justify-between">
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
        <Button onClick={() => window.dispatchEvent(new CustomEvent('navigate-to', { detail: 'dashboard-decisoes' }))}>
          <Database className="h-4 w-4 mr-2" />
          Banco de Jurisprudências
        </Button>
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

      {/* Doutrinadores Citados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Doutrinadores Citados
          </CardTitle>
          <CardDescription>Citações completas com bibliografia pronta para copiar</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 max-h-[600px] overflow-y-auto">
          {doutrinasPreferenciais.length > 0 ? (
            doutrinasPreferenciais.map((citacao, index) => (
              <div key={index} className="p-4 bg-muted/50 rounded-lg border relative group">
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => copiarTexto(citacao, 'Citação doutrinária')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <p className="text-sm whitespace-pre-wrap leading-relaxed pr-10">
                  {citacao}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">Nenhuma doutrina analisada ainda</p>
          )}
        </CardContent>
      </Card>

      {/* Precedentes Utilizados - Largura completa */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Precedentes Utilizados
          </CardTitle>
          <CardDescription>Jurisprudências completas com ementas prontas para copiar</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 max-h-[600px] overflow-y-auto">
          {precedentesMaisUsados.length > 0 ? (
            precedentesMaisUsados.map((citacao, index) => (
              <div key={index} className="p-4 bg-muted/50 rounded-lg border relative group">
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => copiarTexto(citacao, 'Precedente')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <p className="text-sm whitespace-pre-wrap leading-relaxed pr-10">
                  {citacao}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum precedente analisado ainda</p>
          )}
        </CardContent>
      </Card>

      {/* Normas Legais Citadas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Normas Legais Citadas
          </CardTitle>
          <CardDescription>Artigos de lei, resoluções e normas organizadas por tipo</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {normasLegaisCitadas.length > 0 ? (
            normasLegaisCitadas.map((categoria, catIndex) => (
              <div key={catIndex} className="space-y-3">
                <h4 className="font-semibold text-lg">{categoria.tipo}</h4>
                {categoria.normas.map((norma, normaIndex) => (
                  <div key={normaIndex} className="pl-4 border-l-2 border-primary/20">
                    <p className="font-medium text-sm mb-2">{norma.nome}</p>
                    <div className="flex flex-wrap gap-2">
                      {norma.artigos.map((artigo, artigoIndex) => (
                        <Badge key={artigoIndex} variant="outline">
                          {artigo}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">Nenhuma norma legal analisada ainda</p>
          )}
        </CardContent>
      </Card>

      {/* Decisões do Magistrado */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Todas as Decisões Registradas
          </CardTitle>
          <CardDescription>Julgados completos deste magistrado no sistema</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
          {decisoes.length > 0 ? (
            decisoes.map((decisao) => (
              <div key={decisao.id} className="p-4 bg-muted/50 rounded-lg border hover:bg-muted/70 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={
                        decisao.resultado === 'Favorável' ? 'default' : 
                        decisao.resultado === 'Parcialmente Favorável' ? 'secondary' : 
                        'destructive'
                      }>
                        {decisao.resultado}
                      </Badge>
                      <span className="text-sm font-mono text-muted-foreground">{decisao.codigo_unico}</span>
                    </div>
                    <p className="text-sm font-medium">{decisao.numero_processo}</p>
                    <p className="text-xs text-muted-foreground">
                      {decisao.procedimento_objeto} • {new Date(decisao.data_decisao).toLocaleDateString('pt-BR')}
                    </p>
                    {decisao.resumo_decisao && (
                      <p className="text-xs line-clamp-2">{decisao.resumo_decisao}</p>
                    )}
                  </div>
                  {decisao.arquivo_url && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(decisao.arquivo_url, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Abrir
                    </Button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">Nenhuma decisão registrada ainda</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PerfilMagistrado;
