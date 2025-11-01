import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, TrendingUp, DollarSign, BarChart3, PieChart, Scale, Building } from 'lucide-react';
import { useAnalytics } from '@/hooks/useAnalytics';
import {
  PieChart as RechartsPie,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';

interface AnalyticsProps {
  onBack: () => void;
}

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

const Analytics: React.FC<AnalyticsProps> = ({ onBack }) => {
  const { fatoDecisao, dimTribunal, loading } = useAnalytics();
  const [anoFiltro, setAnoFiltro] = useState<string>('todos');
  const [tribunalFiltro, setTribunalFiltro] = useState<string>('todos');

  // Filtrar dados
  const dadosFiltrados = useMemo(() => {
    return fatoDecisao.filter(f => {
      if (anoFiltro !== 'todos' && f.ano !== parseInt(anoFiltro)) return false;
      if (tribunalFiltro !== 'todos' && f.tribunal !== tribunalFiltro) return false;
      return true;
    });
  }, [fatoDecisao, anoFiltro, tribunalFiltro]);

  // Anos disponíveis
  const anos = useMemo(() => 
    [...new Set(fatoDecisao.map(f => f.ano))].sort((a, b) => b - a),
    [fatoDecisao]
  );

  // Tribunais disponíveis
  const tribunais = useMemo(() => 
    [...new Set(fatoDecisao.map(f => f.tribunal))].sort(),
    [fatoDecisao]
  );

  // KPIs
  const kpis = useMemo(() => {
    const total = dadosFiltrados.length;
    const favoraveis = dadosFiltrados.reduce((acc, f) => acc + f.count_favoravel, 0);
    const parciais = dadosFiltrados.reduce((acc, f) => acc + f.count_parcial, 0);
    const taxaExito = total > 0 ? ((favoraveis + (parciais * 0.5)) / total) * 100 : 0;
    const economiaTotal = dadosFiltrados.reduce((acc, f) => acc + (f.economia_gerada_brl || 0), 0);
    const valorMedio = total > 0 ? dadosFiltrados.reduce((acc, f) => acc + (f.valor_em_disputa_brl || 0), 0) / total : 0;

    return { total, taxaExito, economiaTotal, valorMedio };
  }, [dadosFiltrados]);

  // Dados por resultado
  const dadosPorResultado = useMemo(() => {
    const favoraveis = dadosFiltrados.reduce((acc, f) => acc + f.count_favoravel, 0);
    const parciais = dadosFiltrados.reduce((acc, f) => acc + f.count_parcial, 0);
    const desfavoraveis = dadosFiltrados.reduce((acc, f) => acc + f.count_desfavoravel, 0);

    return [
      { name: 'Favorável', value: favoraveis },
      { name: 'Parcial', value: parciais },
      { name: 'Desfavorável', value: desfavoraveis }
    ];
  }, [dadosFiltrados]);

  // Top 10 Magistrados por volume
  const topMagistrados = useMemo(() => {
    const contagem: { [key: string]: number } = {};
    dadosFiltrados.forEach(f => {
      contagem[f.magistrado_nome] = (contagem[f.magistrado_nome] || 0) + 1;
    });

    return Object.entries(contagem)
      .map(([nome, count]) => ({ nome, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [dadosFiltrados]);

  // Taxa de êxito por magistrado (top 10)
  const taxaExitoMagistrado = useMemo(() => {
    const stats: { [key: string]: { total: number; favoravel: number; parcial: number } } = {};
    
    dadosFiltrados.forEach(f => {
      if (!stats[f.magistrado_nome]) {
        stats[f.magistrado_nome] = { total: 0, favoravel: 0, parcial: 0 };
      }
      stats[f.magistrado_nome].total++;
      stats[f.magistrado_nome].favoravel += f.count_favoravel;
      stats[f.magistrado_nome].parcial += f.count_parcial;
    });

    return Object.entries(stats)
      .map(([nome, s]) => ({
        nome,
        taxa: ((s.favoravel + (s.parcial * 0.5)) / s.total) * 100
      }))
      .sort((a, b) => b.taxa - a.taxa)
      .slice(0, 10);
  }, [dadosFiltrados]);

  // Economia por tribunal
  const economiaPorTribunal = useMemo(() => {
    const economia: { [key: string]: number } = {};
    dadosFiltrados.forEach(f => {
      economia[f.tribunal] = (economia[f.tribunal] || 0) + (f.economia_gerada_brl || 0);
    });

    return Object.entries(economia)
      .map(([tribunal, valor]) => ({ tribunal, valor }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 8);
  }, [dadosFiltrados]);

  // Decisões por mês (últimos 12 meses)
  const decisoesPorMes = useMemo(() => {
    const meses: { [key: string]: number } = {};
    dadosFiltrados.forEach(f => {
      const mesAno = `${f.mes.toString().padStart(2, '0')}/${f.ano}`;
      meses[mesAno] = (meses[mesAno] || 0) + 1;
    });

    return Object.entries(meses)
      .map(([mes, count]) => ({ mes, count }))
      .sort((a, b) => a.mes.localeCompare(b.mes))
      .slice(-12);
  }, [dadosFiltrados]);

  // Valor em disputa vs Economia por tema (top 10)
  const valorEconomiaPorTema = useMemo(() => {
    const stats: { [key: string]: { valor: number; economia: number } } = {};
    dadosFiltrados.forEach(f => {
      if (!stats[f.tema]) {
        stats[f.tema] = { valor: 0, economia: 0 };
      }
      stats[f.tema].valor += f.valor_em_disputa_brl || 0;
      stats[f.tema].economia += f.economia_gerada_brl || 0;
    });

    return Object.entries(stats)
      .map(([tema, s]) => ({ tema, valor: s.valor, economia: s.economia }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 10);
  }, [dadosFiltrados]);

  // Distribuição por esfera
  const distribuicaoPorEsfera = useMemo(() => {
    const esferas: { [key: string]: number } = {};
    dadosFiltrados.forEach(f => {
      const esferaInfo = dimTribunal.find(t => t.tribunal === f.tribunal);
      const esfera = esferaInfo?.esfera || 'Outro';
      esferas[esfera] = (esferas[esfera] || 0) + 1;
    });

    return Object.entries(esferas).map(([name, value]) => ({ name, value }));
  }, [dadosFiltrados, dimTribunal]);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
        <div className="text-center py-12">Carregando dados analíticos...</div>
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
            <h1 className="text-3xl font-bold">Analytics - Business Intelligence</h1>
            <p className="text-muted-foreground">Dashboards analíticos de decisões judiciais</p>
          </div>
        </div>
      </div>

      {/* Filtros Globais */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Ano</label>
              <Select value={anoFiltro} onValueChange={setAnoFiltro}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os anos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os anos</SelectItem>
                  {anos.map(ano => (
                    <SelectItem key={ano} value={ano.toString()}>{ano}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tribunal</label>
              <Select value={tribunalFiltro} onValueChange={setTribunalFiltro}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tribunais" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os tribunais</SelectItem>
                  {tribunais.map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs de Dashboards */}
      <Tabs defaultValue="geral" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="geral">Visão Geral</TabsTrigger>
          <TabsTrigger value="magistrados">Magistrados</TabsTrigger>
          <TabsTrigger value="tribunais">Tribunais</TabsTrigger>
          <TabsTrigger value="temas">Temas</TabsTrigger>
        </TabsList>

        {/* Dashboard 1: Visão Geral */}
        <TabsContent value="geral" className="space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total de Decisões</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpis.total}</div>
                <p className="text-xs text-muted-foreground">Decisões analisadas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Taxa de Êxito</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpis.taxaExito.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">Decisões favoráveis</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Economia Total</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(kpis.economiaTotal)}
                </div>
                <p className="text-xs text-muted-foreground">Economia gerada</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Valor Médio</CardTitle>
                <Scale className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(kpis.valorMedio)}
                </div>
                <p className="text-xs text-muted-foreground">Valor em disputa médio</p>
              </CardContent>
            </Card>
          </div>

          {/* Gráficos principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Resultado</CardTitle>
                <CardDescription>Total de decisões por tipo de resultado</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPie>
                    <Pie
                      data={dadosPorResultado}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label
                    >
                      {dadosPorResultado.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </RechartsPie>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Decisões por Mês</CardTitle>
                <CardDescription>Evolução temporal (últimos 12 meses)</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={decisoesPorMes}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" fontSize={10} />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="count" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Esfera</CardTitle>
                <CardDescription>Decisões por esfera judicial</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPie>
                    <Pie
                      data={distribuicaoPorEsfera}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label
                    >
                      {distribuicaoPorEsfera.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </RechartsPie>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Economia por Tribunal</CardTitle>
                <CardDescription>Top 8 tribunais por economia gerada</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={economiaPorTribunal}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="tribunal" angle={-45} textAnchor="end" height={100} fontSize={9} />
                    <YAxis />
                    <Tooltip formatter={(value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)} />
                    <Bar dataKey="valor" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Dashboard 2: Magistrados */}
        <TabsContent value="magistrados" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top 10 Magistrados por Volume</CardTitle>
                <CardDescription>Magistrados com mais decisões</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={topMagistrados} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="nome" type="category" width={150} fontSize={10} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top 10 por Taxa de Êxito</CardTitle>
                <CardDescription>Magistrados com melhores resultados</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={taxaExitoMagistrado} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 100]} />
                    <YAxis dataKey="nome" type="category" width={150} fontSize={10} />
                    <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                    <Bar dataKey="taxa" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Dashboard 3: Tribunais */}
        <TabsContent value="tribunais" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Economia Gerada por Tribunal</CardTitle>
              <CardDescription>Top 8 tribunais em economia gerada</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={economiaPorTribunal}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="tribunal" angle={-45} textAnchor="end" height={120} fontSize={10} />
                  <YAxis />
                  <Tooltip formatter={(value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)} />
                  <Bar dataKey="valor" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Dashboard 4: Temas */}
        <TabsContent value="temas" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Valor em Disputa vs Economia por Tema</CardTitle>
              <CardDescription>Top 10 temas - comparação entre valor e economia</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={valorEconomiaPorTema}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="tema" angle={-45} textAnchor="end" height={120} fontSize={9} />
                  <YAxis />
                  <Tooltip formatter={(value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)} />
                  <Legend />
                  <Bar dataKey="valor" fill="#f59e0b" name="Valor em Disputa" />
                  <Bar dataKey="economia" fill="#10b981" name="Economia Gerada" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Analytics;
