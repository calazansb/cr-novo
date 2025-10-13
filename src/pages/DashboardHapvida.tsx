import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Building2, AlertTriangle, Clock, CheckCircle, User, Pencil, Trash2 } from "lucide-react";
import { usePendencias } from "@/hooks/usePendencias";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

interface DashboardHapvidaProps {
  onBack: () => void;
}

const COLORS = {
  "prazo-recursal": "#ef4444",
  "contestacao": "#f97316",
  "audiencia": "#eab308",
  "documentacao": "#3b82f6",
  "perícia": "#8b5cf6",
  "cumprimento": "#10b981",
  "outros": "#6b7280"
};

const DashboardHapvida = ({ onBack }: DashboardHapvidaProps) => {
  const { pendencias, loading, deletarPendencia, atualizarPendencia } = usePendencias();
  const [selectedPendencia, setSelectedPendencia] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pendenciaToDelete, setPendenciaToDelete] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  // Filtrar apenas pendências da Hapvida
  const pendenciasHapvida = useMemo(() => {
    return pendencias.filter(p => p.cliente === "Hapvida Assistência Médica LTDA");
  }, [pendencias]);

  // Estatísticas
  const stats = useMemo(() => {
    const total = pendenciasHapvida.length;
    const porTipo = pendenciasHapvida.reduce((acc, p) => {
      acc[p.tipo_urgencia] = (acc[p.tipo_urgencia] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const responsaveis = [...new Set(pendenciasHapvida.map(p => p.responsavel))];

    return {
      total,
      porTipo,
      responsaveis: responsaveis.length
    };
  }, [pendenciasHapvida]);

  // Dados para gráfico de barras (Top 5 Responsáveis)
  const dadosResponsaveis = useMemo(() => {
    const contagem = pendenciasHapvida.reduce((acc, p) => {
      acc[p.responsavel] = (acc[p.responsavel] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(contagem)
      .map(([nome, quantidade]) => ({ nome, quantidade }))
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 5);
  }, [pendenciasHapvida]);

  // Dados para gráfico de pizza (Tipos de Urgência)
  const dadosTipos = useMemo(() => {
    return Object.entries(stats.porTipo).map(([tipo, quantidade]) => ({
      name: tipo.replace("-", " ").toUpperCase(),
      value: quantidade
    }));
  }, [stats.porTipo]);

  const getTipoColor = (tipo: string) => {
    return COLORS[tipo as keyof typeof COLORS] || COLORS.outros;
  };

  const getTipoBadgeVariant = (tipo: string): "destructive" | "default" | "secondary" => {
    if (tipo === "prazo-recursal" || tipo === "contestacao") return "destructive";
    if (tipo === "audiencia" || tipo === "documentacao") return "default";
    return "secondary";
  };

  const openEditDialog = (pendencia: any) => {
    setEditForm({
      numero_processo: pendencia.numero_processo,
      orgao: pendencia.orgao,
      tipo_urgencia: pendencia.tipo_urgencia,
      prazo_limite: pendencia.prazo_limite,
      responsavel: pendencia.responsavel,
      cliente: pendencia.cliente,
      descricao: pendencia.descricao,
      observacoes: pendencia.observacoes || '',
    });
    setSelectedPendencia(pendencia);
    setEditDialogOpen(true);
  };

  const handleEdit = async () => {
    if (!selectedPendencia) return;

    try {
      await atualizarPendencia(selectedPendencia.id, editForm);
      setEditDialogOpen(false);
    } catch (error) {
      // Error is already handled in the hook
    }
  };

  const confirmDelete = (id: string) => {
    setPendenciaToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!pendenciaToDelete) return;

    try {
      await deletarPendencia(pendenciaToDelete);
      setDeleteDialogOpen(false);
      setPendenciaToDelete(null);
    } catch (error) {
      // Error is already handled in the hook
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            onClick={onBack}
            variant="ghost"
            size="sm"
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gradient flex items-center gap-3">
              <Building2 className="h-8 w-8 text-emerald-500" />
              Dashboard Hapvida
            </h1>
            <p className="text-muted-foreground mt-1">
              Visão geral das pendências e urgências do cliente Hapvida
            </p>
          </div>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-elevated hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Pendências</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              Registros ativos
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-elevated hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tipos de Urgência</CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(stats.porTipo).length}</div>
            <p className="text-xs text-muted-foreground">
              Categorias diferentes
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-elevated hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Responsáveis</CardTitle>
            <User className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.responsaveis}</div>
            <p className="text-xs text-muted-foreground">
              Advogados envolvidos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="shadow-elevated">
          <CardHeader>
            <CardTitle>Top 5 Responsáveis</CardTitle>
            <CardDescription>Advogados com mais pendências</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dadosResponsaveis}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nome" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="quantidade" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-elevated">
          <CardHeader>
            <CardTitle>Pendências por Tipo</CardTitle>
            <CardDescription>Distribuição de urgências</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dadosTipos}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {dadosTipos.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={Object.values(COLORS)[index % Object.values(COLORS).length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Pendências */}
      <Card className="shadow-elevated">
        <CardHeader>
          <CardTitle>Todas as Pendências Hapvida</CardTitle>
          <CardDescription>
            Histórico completo de pendências e urgências registradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : pendenciasHapvida.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma pendência registrada para Hapvida
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Protocolo</TableHead>
                    <TableHead>Processo</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Prazo</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendenciasHapvida.map((pendencia) => (
                    <TableRow key={pendencia.id}>
                      <TableCell className="font-mono text-xs">{pendencia.codigo_unico}</TableCell>
                      <TableCell className="font-medium">{pendencia.numero_processo}</TableCell>
                      <TableCell>
                        <Badge variant={getTipoBadgeVariant(pendencia.tipo_urgencia)}>
                          {pendencia.tipo_urgencia}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(pendencia.prazo_limite), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell>{pendencia.responsavel}</TableCell>
                      <TableCell>
                        {format(new Date(pendencia.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedPendencia(pendencia)}
                              >
                                Ver detalhes
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Detalhes da Pendência</DialogTitle>
                                <DialogDescription>
                                  Protocolo: {pendencia.codigo_unico}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <p className="text-sm font-medium">Número do Processo</p>
                                  <p className="text-sm text-muted-foreground">{pendencia.numero_processo}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium">Órgão</p>
                                  <p className="text-sm text-muted-foreground">{pendencia.orgao}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium">Tipo de Urgência</p>
                                  <Badge variant={getTipoBadgeVariant(pendencia.tipo_urgencia)}>
                                    {pendencia.tipo_urgencia}
                                  </Badge>
                                </div>
                                <div>
                                  <p className="text-sm font-medium">Descrição</p>
                                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{pendencia.descricao}</p>
                                </div>
                                {pendencia.observacoes && (
                                  <div>
                                    <p className="text-sm font-medium">Observações</p>
                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{pendencia.observacoes}</p>
                                  </div>
                                )}
                                <div>
                                  <p className="text-sm font-medium">Registrado por</p>
                                  <p className="text-sm text-muted-foreground">
                                    {pendencia.profiles?.nome || 'Usuário desconhecido'}
                                  </p>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(pendencia)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => confirmDelete(pendencia.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Pendência</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Número do Processo</Label>
              <Input
                value={editForm.numero_processo || ''}
                onChange={(e) => setEditForm({ ...editForm, numero_processo: e.target.value })}
              />
            </div>
            <div>
              <Label>Órgão</Label>
              <Input
                value={editForm.orgao || ''}
                onChange={(e) => setEditForm({ ...editForm, orgao: e.target.value })}
              />
            </div>
            <div>
              <Label>Tipo de Urgência</Label>
              <Input
                value={editForm.tipo_urgencia || ''}
                onChange={(e) => setEditForm({ ...editForm, tipo_urgencia: e.target.value })}
              />
            </div>
            <div>
              <Label>Prazo Limite</Label>
              <Input
                type="date"
                value={editForm.prazo_limite || ''}
                onChange={(e) => setEditForm({ ...editForm, prazo_limite: e.target.value })}
              />
            </div>
            <div>
              <Label>Responsável</Label>
              <Input
                value={editForm.responsavel || ''}
                onChange={(e) => setEditForm({ ...editForm, responsavel: e.target.value })}
              />
            </div>
            <div>
              <Label>Cliente</Label>
              <Input
                value={editForm.cliente || ''}
                onChange={(e) => setEditForm({ ...editForm, cliente: e.target.value })}
              />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea
                value={editForm.descricao || ''}
                onChange={(e) => setEditForm({ ...editForm, descricao: e.target.value })}
                rows={4}
              />
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea
                value={editForm.observacoes || ''}
                onChange={(e) => setEditForm({ ...editForm, observacoes: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleEdit}>
                Salvar Alterações
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta pendência? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DashboardHapvida;