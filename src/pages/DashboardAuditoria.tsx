import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, RefreshCw, Shield, Users, Activity, Database, FileText, Trash2, Filter } from "lucide-react";
import { useAuditLogs } from "@/hooks/useAuditLogs";
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import * as XLSX from 'xlsx';
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b'];

const OPERATION_COLORS: { [key: string]: string } = {
  'INSERT': '#10b981',
  'UPDATE': '#3b82f6',
  'DELETE': '#ef4444',
  'SELECT': '#6366f1'
};

export default function DashboardAuditoria() {
  const { logs, stats, loading, carregarLogs, carregarEstatisticas, limparLogsAntigos } = useAuditLogs();
  const { toast } = useToast();
  
  const [filtros, setFiltros] = useState({
    startDate: '',
    endDate: '',
    tableName: '',
    operation: '',
    userId: ''
  });

  const [retentionDays, setRetentionDays] = useState(365);

  const aplicarFiltros = () => {
    const filtrosAtivos: any = {};
    if (filtros.startDate) filtrosAtivos.startDate = filtros.startDate;
    if (filtros.endDate) filtrosAtivos.endDate = filtros.endDate;
    if (filtros.tableName) filtrosAtivos.tableName = filtros.tableName;
    if (filtros.operation) filtrosAtivos.operation = filtros.operation;
    if (filtros.userId) filtrosAtivos.userId = filtros.userId;
    
    carregarLogs(filtrosAtivos);
  };

  const limparFiltros = () => {
    setFiltros({
      startDate: '',
      endDate: '',
      tableName: '',
      operation: '',
      userId: ''
    });
    carregarLogs();
  };

  const exportarParaExcel = () => {
    const wb = XLSX.utils.book_new();

    // Logs de Auditoria
    if (logs.length > 0) {
      const wsLogs = XLSX.utils.json_to_sheet(logs.map(log => ({
        'Data/Hora': new Date(log.created_at).toLocaleString('pt-BR'),
        'Operação': log.operation,
        'Tabela': log.table_name,
        'ID Registro': log.record_id || '-',
        'Usuário': log.user_email || 'Sistema',
        'Campos Alterados': log.changed_fields?.join(', ') || '-'
      })));
      XLSX.utils.book_append_sheet(wb, wsLogs, 'Logs Auditoria');
    }

    // Estatísticas
    if (stats) {
      const wsStats = XLSX.utils.json_to_sheet([{
        'Total de Logs': stats.totalLogs,
        'Total de Usuários': stats.totalUsers,
        'Período': `${logs[logs.length - 1]?.created_at || ''} até ${logs[0]?.created_at || ''}`
      }]);
      XLSX.utils.book_append_sheet(wb, wsStats, 'Estatísticas');

      // Atividade por Tabela
      if (stats.activityByTable.length > 0) {
        const wsActivity = XLSX.utils.json_to_sheet(stats.activityByTable);
        XLSX.utils.book_append_sheet(wb, wsActivity, 'Atividade por Tabela');
      }

      // Top Usuários
      if (stats.topUsers.length > 0) {
        const wsUsers = XLSX.utils.json_to_sheet(stats.topUsers);
        XLSX.utils.book_append_sheet(wb, wsUsers, 'Top Usuários');
      }
    }

    XLSX.writeFile(wb, `auditoria-lgpd-${new Date().toISOString().split('T')[0]}.xlsx`);
    
    toast({
      title: "Relatório exportado!",
      description: "O arquivo Excel foi baixado com sucesso.",
    });
  };

  if (loading && !stats) {
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
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              Auditoria & Compliance LGPD
            </span>
          </h1>
          <p className="text-muted-foreground mt-1">
            Rastreamento completo de todas operações no sistema
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { carregarLogs(); carregarEstatisticas(); }}>
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
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-l-4 border-l-primary">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Total de Logs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalLogs.toLocaleString('pt-BR')}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Registros de auditoria
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Usuários Ativos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Usuários únicos
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Database className="h-4 w-4" />
                Tabelas Monitoradas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats.activityByTable.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Com auditoria ativa
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Atividade Recente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">{stats.recentActivity.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Últimas 50 operações
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros de Busca
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Data Início</Label>
              <Input
                id="startDate"
                type="date"
                value={filtros.startDate}
                onChange={(e) => setFiltros({ ...filtros, startDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Data Fim</Label>
              <Input
                id="endDate"
                type="date"
                value={filtros.endDate}
                onChange={(e) => setFiltros({ ...filtros, endDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tableName">Tabela</Label>
              <Input
                id="tableName"
                placeholder="Nome da tabela"
                value={filtros.tableName}
                onChange={(e) => setFiltros({ ...filtros, tableName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="operation">Operação</Label>
              <Select value={filtros.operation} onValueChange={(value) => setFiltros({ ...filtros, operation: value })}>
                <SelectTrigger id="operation">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas</SelectItem>
                  <SelectItem value="INSERT">INSERT</SelectItem>
                  <SelectItem value="UPDATE">UPDATE</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={aplicarFiltros} className="flex-1">
                Aplicar
              </Button>
              <Button onClick={limparFiltros} variant="outline">
                Limpar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gráficos */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Operações por Tipo */}
          <Card>
            <CardHeader>
              <CardTitle>Distribuição de Operações</CardTitle>
              <CardDescription>Tipo de operações realizadas</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats.operationsByType}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ operation, count }) => `${operation}: ${count}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {stats.operationsByType.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={OPERATION_COLORS[entry.operation] || COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Atividade por Tabela */}
          <Card>
            <CardHeader>
              <CardTitle>Atividade por Tabela (Top 10)</CardTitle>
              <CardDescription>Tabelas com mais operações</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.activityByTable}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="table" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Top Usuários */}
      {stats && stats.topUsers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Usuários Mais Ativos</CardTitle>
            <CardDescription>Usuários com maior número de operações registradas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.topUsers.map((user, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold">{user.email}</p>
                      <p className="text-sm text-muted-foreground">{user.count} operações</p>
                    </div>
                  </div>
                  <Badge variant="outline">{((user.count / stats.totalLogs) * 100).toFixed(1)}%</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Logs Recentes */}
      <Card>
        <CardHeader>
          <CardTitle>Logs Recentes de Auditoria</CardTitle>
          <CardDescription>Últimas {Math.min(logs.length, 50)} operações registradas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {logs.slice(0, 50).map((log) => (
              <div key={log.id} className="flex items-start gap-4 p-4 border rounded-lg hover:bg-accent/30 transition-colors">
                <Badge 
                  style={{ backgroundColor: OPERATION_COLORS[log.operation] || '#6366f1' }}
                  className="text-white shrink-0"
                >
                  {log.operation}
                </Badge>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold truncate">{log.table_name}</p>
                    <p className="text-xs text-muted-foreground shrink-0">
                      {new Date(log.created_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {log.user_email || 'Sistema'} 
                    {log.record_id && ` • ID: ${log.record_id}`}
                  </p>
                  {log.changed_fields && log.changed_fields.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {log.changed_fields.map((field, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {field}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Gestão de Retenção de Dados */}
      <Card className="border-amber-500/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-600">
            <Trash2 className="h-5 w-5" />
            Gestão de Retenção de Dados (LGPD)
          </CardTitle>
          <CardDescription>
            Remova logs antigos para conformidade com políticas de retenção
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor="retentionDays">Período de Retenção (dias)</Label>
              <Input
                id="retentionDays"
                type="number"
                min="1"
                max="3650"
                value={retentionDays}
                onChange={(e) => setRetentionDays(parseInt(e.target.value) || 365)}
              />
              <p className="text-xs text-muted-foreground">
                Logs mais antigos que {retentionDays} dias serão removidos permanentemente
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Limpar Logs Antigos
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar Remoção de Logs</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação removerá permanentemente todos os logs de auditoria mais antigos que {retentionDays} dias.
                    Esta operação não pode ser desfeita. Tem certeza que deseja continuar?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => limparLogsAntigos(retentionDays)}>
                    Confirmar Remoção
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
