import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, TrendingUp, TrendingDown, DollarSign, Scale, Users, Target, RefreshCw } from "lucide-react";
import { useDashboardExecutivo } from "@/hooks/useDashboardExecutivo";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import * as XLSX from 'xlsx';
import { useToast } from "@/hooks/use-toast";

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1'];

export default function DashboardExecutivo() {
  const {
    loading,
    metricasGerais,
    performanceAdvogados,
    distribuicaoResultados,
    topMagistrados,
    evolucaoTemporal,
    heatmapTribunais,
    recarregar
  } = useDashboardExecutivo();

  const { toast } = useToast();

  const exportarParaExcel = () => {
    const wb = XLSX.utils.book_new();

    // Métricas Gerais
    if (metricasGerais) {
      const wsMetricas = XLSX.utils.json_to_sheet([{
        'Total de Decisões': metricasGerais.totalDecisoes,
        'Economia Total (R$)': metricasGerais.economiaTotal.toFixed(2),
        'Taxa de Êxito (%)': metricasGerais.taxaExito.toFixed(2),
        'Decisões (30 dias)': metricasGerais.decisoesUltimos30Dias,
        'Crescimento Mensal (%)': metricasGerais.crescimentoMensal.toFixed(2)
      }]);
      XLSX.utils.book_append_sheet(wb, wsMetricas, 'Métricas Gerais');
    }

    // Performance Advogados
    if (performanceAdvogados.length > 0) {
      const wsAdvogados = XLSX.utils.json_to_sheet(performanceAdvogados.map(a => ({
        'Advogado': a.nome,
        'Total Decisões': a.totalDecisoes,
        'Taxa Êxito (%)': a.taxaExito.toFixed(2),
        'Economia Gerada (R$)': a.economiaGerada.toFixed(2),
        'Favoráveis': a.decisoesFavoraveis,
        'Parciais': a.decisoesParciais,
        'Desfavoráveis': a.decisaoDesfavoraveis
      })));
      XLSX.utils.book_append_sheet(wb, wsAdvogados, 'Performance Advogados');
    }

    // Top Magistrados
    if (topMagistrados.length > 0) {
      const wsMagistrados = XLSX.utils.json_to_sheet(topMagistrados.map(m => ({
        'Magistrado': m.nome,
        'Tribunal': m.tribunal,
        'Total Decisões': m.totalDecisoes,
        'Taxa Êxito (%)': m.taxaExito.toFixed(2),
        'Economia Média (R$)': m.economiaMedia.toFixed(2)
      })));
      XLSX.utils.book_append_sheet(wb, wsMagistrados, 'Top Magistrados');
    }

    // Heatmap Tribunais
    if (heatmapTribunais.length > 0) {
      const wsTribunais = XLSX.utils.json_to_sheet(heatmapTribunais.map(t => ({
        'Tribunal': t.tribunal,
        'Comarca': t.comarca || 'Geral',
        'Total Decisões': t.totalDecisoes,
        'Taxa Êxito (%)': t.taxaExito.toFixed(2)
      })));
      XLSX.utils.book_append_sheet(wb, wsTribunais, 'Tribunais');
    }

    XLSX.writeFile(wb, `dashboard-executivo-${new Date().toISOString().split('T')[0]}.xlsx`);
    
    toast({
      title: "Relatório exportado!",
      description: "O arquivo Excel foi baixado com sucesso.",
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Dashboard Executivo
          </h1>
          <p className="text-muted-foreground mt-1">
            Visão estratégica e métricas de performance
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={recarregar}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
          <Button onClick={exportarParaExcel}>
            <Download className="mr-2 h-4 w-4" />
            Exportar Excel
          </Button>
        </div>
      </div>

      {/* Métricas Principais */}
      {metricasGerais && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-l-4 border-l-primary">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Scale className="h-4 w-4" />
                Total de Decisões
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{metricasGerais.totalDecisoes}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {metricasGerais.decisoesUltimos30Dias} nos últimos 30 dias
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Economia Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                R$ {metricasGerais.economiaTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Valor economizado total
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Target className="h-4 w-4" />
                Taxa de Êxito
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {metricasGerais.taxaExito.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Decisões favoráveis/parciais
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                {metricasGerais.crescimentoMensal >= 0 ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                Crescimento Mensal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${metricasGerais.crescimentoMensal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {metricasGerais.crescimentoMensal >= 0 ? '+' : ''}{metricasGerais.crescimentoMensal.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                vs. período anterior
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Gráficos Principais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Evolução Temporal */}
        <Card>
          <CardHeader>
            <CardTitle>Evolução Temporal (12 meses)</CardTitle>
            <CardDescription>Decisões e economia gerada por mês</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={evolucaoTemporal}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="decisoes" stroke="#8b5cf6" name="Decisões" strokeWidth={2} />
                <Line yAxisId="right" type="monotone" dataKey="economia" stroke="#10b981" name="Economia (R$)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribuição de Resultados */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Resultados</CardTitle>
            <CardDescription>Proporção de cada tipo de resultado</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={distribuicaoResultados}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ resultado, percentual }) => `${resultado}: ${percentual.toFixed(1)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="quantidade"
                >
                  {distribuicaoResultados.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Performance por Advogado */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Performance por Advogado
          </CardTitle>
          <CardDescription>Ranking por economia gerada e taxa de êxito</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={performanceAdvogados.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="nome" angle={-45} textAnchor="end" height={120} />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="economiaGerada" fill="#10b981" name="Economia Gerada (R$)" />
              <Bar yAxisId="right" dataKey="taxaExito" fill="#3b82f6" name="Taxa de Êxito (%)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top 10 Magistrados */}
      <Card>
        <CardHeader>
          <CardTitle>Top 10 Magistrados (Taxa de Êxito)</CardTitle>
          <CardDescription>Magistrados com melhores resultados favoráveis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topMagistrados.map((mag, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-semibold">{mag.nome}</p>
                    <p className="text-sm text-muted-foreground">{mag.tribunal}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">{mag.taxaExito.toFixed(1)}%</p>
                  <p className="text-sm text-muted-foreground">
                    {mag.totalDecisoes} decisões | R$ {mag.economiaMedia.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} média
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Heatmap Tribunais */}
      <Card>
        <CardHeader>
          <CardTitle>Performance por Tribunal/Comarca</CardTitle>
          <CardDescription>Top 20 tribunais/comarcas por volume e taxa de êxito</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {heatmapTribunais.map((trib, index) => (
              <div 
                key={index} 
                className="p-4 border rounded-lg"
                style={{
                  background: `linear-gradient(135deg, hsl(var(--primary) / ${trib.taxaExito / 100}) 0%, transparent 100%)`
                }}
              >
                <p className="font-semibold text-sm">{trib.tribunal}</p>
                {trib.comarca && (
                  <p className="text-xs text-muted-foreground">{trib.comarca}</p>
                )}
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs">Taxa: {trib.taxaExito.toFixed(1)}%</span>
                  <span className="text-xs font-medium">{trib.totalDecisoes} decisões</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
