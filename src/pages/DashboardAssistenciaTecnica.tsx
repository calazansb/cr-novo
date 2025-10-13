import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Settings, Pencil, Trash2 } from "lucide-react";
import { useAssistenciaTecnica } from "@/hooks/useAssistenciaTecnica";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const DashboardAssistenciaTecnica = () => {
  const { assistencias, loading, atualizarStatus, deletarAssistencia } = useAssistenciaTecnica();
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [assistenciaSelecionada, setAssistenciaSelecionada] = useState<string | null>(null);
  const [novoStatus, setNovoStatus] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const handleEditStatus = (id: string, statusAtual: string) => {
    setAssistenciaSelecionada(id);
    setNovoStatus(statusAtual);
    setObservacoes("");
    setStatusDialogOpen(true);
  };

  const handleConfirmStatus = async () => {
    if (assistenciaSelecionada) {
      await atualizarStatus(assistenciaSelecionada, novoStatus, observacoes);
      setStatusDialogOpen(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setAssistenciaSelecionada(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (assistenciaSelecionada) {
      await deletarAssistencia(assistenciaSelecionada);
      setDeleteDialogOpen(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pendente: "bg-yellow-500",
      em_atendimento: "bg-blue-500",
      resolvido: "bg-green-500",
      cancelado: "bg-red-500"
    };
    return colors[status] || "bg-gray-500";
  };

  const getUrgenciaColor = (urgencia: string) => {
    const colors: Record<string, string> = {
      Alta: "destructive",
      Média: "secondary",
      Baixa: "outline"
    };
    return colors[urgencia] || "outline";
  };

  if (loading) {
    return <div className="p-8 text-center">Carregando...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Assistência Técnica</h1>
        <p className="text-muted-foreground">Gerencie todas as solicitações de assistência técnica</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Todas as Solicitações
          </CardTitle>
          <CardDescription>
            Total de {assistencias.length} solicitação(ões) registrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Protocolo</TableHead>
                <TableHead>Solicitante</TableHead>
                <TableHead>Urgência</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assistencias.map((assistencia) => (
                <TableRow key={assistencia.id}>
                  <TableCell className="font-mono">{assistencia.codigo_unico}</TableCell>
                  <TableCell>{assistencia.nome_solicitante}</TableCell>
                  <TableCell>
                    <Badge variant={getUrgenciaColor(assistencia.nivel_urgencia) as any}>
                      {assistencia.nivel_urgencia}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(assistencia.status)}>
                      {assistencia.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{format(new Date(assistencia.created_at), 'dd/MM/yyyy HH:mm')}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => handleEditStatus(assistencia.id, assistencia.status)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        onClick={() => handleDeleteClick(assistencia.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog para editar status */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atualizar Status</DialogTitle>
            <DialogDescription>Altere o status e adicione observações</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Status</label>
              <Select value={novoStatus} onValueChange={setNovoStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="em_atendimento">Em Atendimento</SelectItem>
                  <SelectItem value="resolvido">Resolvido</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Observações</label>
              <Textarea
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Adicione observações sobre esta alteração..."
                rows={4}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleConfirmStatus}>Confirmar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta solicitação? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DashboardAssistenciaTecnica;
