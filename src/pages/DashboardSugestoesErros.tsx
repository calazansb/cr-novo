import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Lightbulb, AlertTriangle, Pencil, Trash2 } from "lucide-react";
import { useSugestoesErros } from "@/hooks/useSugestoesErros";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const DashboardSugestoesErros = () => {
  const { registros, loading, atualizarStatus, deletarRegistro } = useSugestoesErros();
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [registroSelecionado, setRegistroSelecionado] = useState<string | null>(null);
  const [novoStatus, setNovoStatus] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const sugestoes = registros.filter(r => r.tipo === 'sugestao');
  const erros = registros.filter(r => r.tipo === 'erro');

  const handleEditStatus = (id: string, statusAtual: string) => {
    setRegistroSelecionado(id);
    setNovoStatus(statusAtual);
    setObservacoes("");
    setStatusDialogOpen(true);
  };

  const handleConfirmStatus = async () => {
    if (registroSelecionado) {
      await atualizarStatus(registroSelecionado, novoStatus, observacoes);
      setStatusDialogOpen(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setRegistroSelecionado(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (registroSelecionado) {
      await deletarRegistro(registroSelecionado);
      setDeleteDialogOpen(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pendente: "bg-yellow-500",
      em_analise: "bg-blue-500",
      aprovado: "bg-green-500",
      rejeitado: "bg-red-500",
      implementado: "bg-purple-500"
    };
    return colors[status] || "bg-gray-500";
  };

  const renderTable = (dados: typeof registros, tipo: 'sugestao' | 'erro') => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Protocolo</TableHead>
          <TableHead>Título</TableHead>
          <TableHead>Categoria</TableHead>
          <TableHead>Urgência</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Data</TableHead>
          <TableHead>Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {dados.map((registro) => (
          <TableRow key={registro.id}>
            <TableCell className="font-mono">{registro.codigo_unico}</TableCell>
            <TableCell>{registro.titulo}</TableCell>
            <TableCell>{registro.categoria}</TableCell>
            <TableCell>
              <Badge variant={registro.urgencia === 'alta' ? 'destructive' : 'secondary'}>
                {registro.urgencia}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge className={getStatusColor(registro.status)}>
                {registro.status}
              </Badge>
            </TableCell>
            <TableCell>{format(new Date(registro.created_at), 'dd/MM/yyyy')}</TableCell>
            <TableCell>
              <div className="flex gap-2">
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => handleEditStatus(registro.id, registro.status)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="destructive"
                  onClick={() => handleDeleteClick(registro.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  if (loading) {
    return <div className="p-8 text-center">Carregando...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Sugestões e Erros</h1>
        <p className="text-muted-foreground">Gerencie todas as sugestões e erros registrados</p>
      </div>

      <Tabs defaultValue="sugestoes" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="sugestoes">
            <Lightbulb className="h-4 w-4 mr-2" />
            Sugestões ({sugestoes.length})
          </TabsTrigger>
          <TabsTrigger value="erros">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Erros ({erros.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sugestoes">
          <Card>
            <CardHeader>
              <CardTitle>Todas as Sugestões</CardTitle>
              <CardDescription>Visualize e gerencie todas as sugestões de melhoria</CardDescription>
            </CardHeader>
            <CardContent>
              {renderTable(sugestoes, 'sugestao')}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="erros">
          <Card>
            <CardHeader>
              <CardTitle>Todos os Erros</CardTitle>
              <CardDescription>Visualize e gerencie todos os erros reportados</CardDescription>
            </CardHeader>
            <CardContent>
              {renderTable(erros, 'erro')}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
                  <SelectItem value="em_analise">Em Análise</SelectItem>
                  <SelectItem value="aprovado">Aprovado</SelectItem>
                  <SelectItem value="rejeitado">Rejeitado</SelectItem>
                  <SelectItem value="implementado">Implementado</SelectItem>
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
              Tem certeza que deseja excluir este registro? Esta ação não pode ser desfeita.
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

export default DashboardSugestoesErros;
