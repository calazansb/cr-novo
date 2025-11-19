import { useState, useEffect } from 'react';
import { useAutomacoes, AutomacaoJuridica, ProcessoMonitorado } from '@/hooks/useAutomacoes';
import { useCNJSearch } from '@/hooks/useCNJSearch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Trash2, Plus, Clock, CheckCircle2, AlertCircle, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

export default function AutomacoesJuridicas() {
  const [automacoes, setAutomacoes] = useState<AutomacaoJuridica[]>([]);
  const [processosMonitorados, setProcessosMonitorados] = useState<ProcessoMonitorado[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isMonitorDialogOpen, setIsMonitorDialogOpen] = useState(false);
  
  const { 
    loading, 
    fetchAutomacoes, 
    createAutomacao, 
    updateAutomacao, 
    deleteAutomacao,
    fetchProcessosMonitorados,
    addProcessoMonitorado,
    updateProcessoMonitorado 
  } = useAutomacoes();
  
  const { buscarProcesso } = useCNJSearch();

  const [novaAutomacao, setNovaAutomacao] = useState({
    nome: '',
    descricao: '',
    tipo_automacao: 'consulta_cnj' as const,
    frequencia: 'diaria' as const,
    parametros: {},
  });

  const [novoProcesso, setNovoProcesso] = useState({
    numero_processo: '',
    cliente: '',
    orgao: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [automacoesData, processosData] = await Promise.all([
      fetchAutomacoes(),
      fetchProcessosMonitorados(),
    ]);
    setAutomacoes(automacoesData);
    setProcessosMonitorados(processosData);
  };

  const handleCreateAutomacao = async () => {
    const result = await createAutomacao(novaAutomacao);
    if (result) {
      setIsDialogOpen(false);
      setNovaAutomacao({
        nome: '',
        descricao: '',
        tipo_automacao: 'consulta_cnj',
        frequencia: 'diaria',
        parametros: {},
      });
      loadData();
    }
  };

  const handleAddProcessoMonitorado = async () => {
    const result = await addProcessoMonitorado(
      novoProcesso.numero_processo,
      novoProcesso.cliente,
      novoProcesso.orgao
    );
    if (result) {
      setIsMonitorDialogOpen(false);
      setNovoProcesso({ numero_processo: '', cliente: '', orgao: '' });
      loadData();
    }
  };

  const handleToggleStatus = async (automacao: AutomacaoJuridica) => {
    const newStatus = automacao.status === 'ativa' ? 'pausada' : 'ativa';
    await updateAutomacao(automacao.id, { status: newStatus });
    loadData();
  };

  const handleToggleProcessoStatus = async (processo: ProcessoMonitorado) => {
    const newStatus = processo.status === 'ativo' ? 'pausado' : 'ativo';
    await updateProcessoMonitorado(processo.id, { status: newStatus });
    loadData();
  };

  const handleDeleteAutomacao = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta automação?')) {
      await deleteAutomacao(id);
      loadData();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativa':
      case 'ativo':
        return 'bg-green-500';
      case 'pausada':
      case 'pausado':
        return 'bg-yellow-500';
      case 'erro':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'consulta_cnj':
        return 'Consulta CNJ';
      case 'monitoramento_processo':
        return 'Monitoramento de Processo';
      case 'verificacao_prazos':
        return 'Verificação de Prazos';
      default:
        return tipo;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Automações Jurídicas</h1>
          <p className="text-muted-foreground">Gerencie consultas automáticas e monitoramento de processos</p>
        </div>
      </div>

      <Tabs defaultValue="automacoes" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="automacoes">Automações</TabsTrigger>
          <TabsTrigger value="processos">Processos Monitorados</TabsTrigger>
        </TabsList>

        <TabsContent value="automacoes" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Automação
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Nova Automação</DialogTitle>
                  <DialogDescription>
                    Configure uma nova automação para consultas jurídicas
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome da Automação</Label>
                    <Input
                      id="nome"
                      value={novaAutomacao.nome}
                      onChange={(e) => setNovaAutomacao({ ...novaAutomacao, nome: e.target.value })}
                      placeholder="Ex: Consulta diária de processos"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="descricao">Descrição</Label>
                    <Textarea
                      id="descricao"
                      value={novaAutomacao.descricao}
                      onChange={(e) => setNovaAutomacao({ ...novaAutomacao, descricao: e.target.value })}
                      placeholder="Descreva o objetivo desta automação"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tipo">Tipo de Automação</Label>
                    <Select
                      value={novaAutomacao.tipo_automacao}
                      onValueChange={(value: any) => setNovaAutomacao({ ...novaAutomacao, tipo_automacao: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="consulta_cnj">Consulta CNJ</SelectItem>
                        <SelectItem value="monitoramento_processo">Monitoramento de Processo</SelectItem>
                        <SelectItem value="verificacao_prazos">Verificação de Prazos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="frequencia">Frequência</Label>
                    <Select
                      value={novaAutomacao.frequencia}
                      onValueChange={(value: any) => setNovaAutomacao({ ...novaAutomacao, frequencia: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="horaria">A cada hora</SelectItem>
                        <SelectItem value="diaria">Diária</SelectItem>
                        <SelectItem value="semanal">Semanal</SelectItem>
                        <SelectItem value="mensal">Mensal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateAutomacao} disabled={loading || !novaAutomacao.nome}>
                    Criar Automação
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {automacoes.map((automacao) => (
              <Card key={automacao.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{automacao.nome}</CardTitle>
                      <CardDescription>{automacao.codigo_unico}</CardDescription>
                    </div>
                    <Badge className={getStatusColor(automacao.status)}>
                      {automacao.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm space-y-2">
                    <p><strong>Tipo:</strong> {getTipoLabel(automacao.tipo_automacao)}</p>
                    <p><strong>Frequência:</strong> {automacao.frequencia}</p>
                    <p><strong>Execuções:</strong> {automacao.total_execucoes}</p>
                    {automacao.ultima_execucao && (
                      <p className="text-muted-foreground">
                        <Clock className="inline h-3 w-3 mr-1" />
                        Última: {new Date(automacao.ultima_execucao).toLocaleString('pt-BR')}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={automacao.status === 'ativa' ? 'outline' : 'default'}
                      onClick={() => handleToggleStatus(automacao)}
                    >
                      {automacao.status === 'ativa' ? (
                        <><Pause className="h-4 w-4 mr-1" /> Pausar</>
                      ) : (
                        <><Play className="h-4 w-4 mr-1" /> Ativar</>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteAutomacao(automacao.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {automacoes.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma automação configurada ainda.</p>
                <p className="text-sm">Clique em "Nova Automação" para começar.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="processos" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={isMonitorDialogOpen} onOpenChange={setIsMonitorDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Processo
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Processo ao Monitoramento</DialogTitle>
                  <DialogDescription>
                    O processo será consultado automaticamente no CNJ
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="numero_processo">Número do Processo</Label>
                    <Input
                      id="numero_processo"
                      value={novoProcesso.numero_processo}
                      onChange={(e) => setNovoProcesso({ ...novoProcesso, numero_processo: e.target.value })}
                      placeholder="0000000-00.0000.0.00.0000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cliente">Cliente (opcional)</Label>
                    <Input
                      id="cliente"
                      value={novoProcesso.cliente}
                      onChange={(e) => setNovoProcesso({ ...novoProcesso, cliente: e.target.value })}
                      placeholder="Nome do cliente"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="orgao">Órgão (opcional)</Label>
                    <Input
                      id="orgao"
                      value={novoProcesso.orgao}
                      onChange={(e) => setNovoProcesso({ ...novoProcesso, orgao: e.target.value })}
                      placeholder="Ex: TJSP, TRF3"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsMonitorDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleAddProcessoMonitorado} disabled={loading || !novoProcesso.numero_processo}>
                    Adicionar
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {processosMonitorados.map((processo) => (
              <Card key={processo.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{processo.numero_processo}</CardTitle>
                      {processo.cliente && <CardDescription>{processo.cliente}</CardDescription>}
                    </div>
                    <Badge className={getStatusColor(processo.status)}>
                      {processo.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {processo.orgao && <p><strong>Órgão:</strong> {processo.orgao}</p>}
                    <p><strong>Notificações:</strong> {processo.notificacoes_enviadas}</p>
                    {processo.ultima_verificacao && (
                      <p className="text-muted-foreground col-span-2">
                        <Eye className="inline h-3 w-3 mr-1" />
                        Última verificação: {new Date(processo.ultima_verificacao).toLocaleString('pt-BR')}
                      </p>
                    )}
                    {processo.ultima_atualizacao_detectada && (
                      <p className="text-green-600 col-span-2">
                        <CheckCircle2 className="inline h-3 w-3 mr-1" />
                        Última atualização: {new Date(processo.ultima_atualizacao_detectada).toLocaleString('pt-BR')}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={processo.status === 'ativo' ? 'outline' : 'default'}
                      onClick={() => handleToggleProcessoStatus(processo)}
                    >
                      {processo.status === 'ativo' ? (
                        <><Pause className="h-4 w-4 mr-1" /> Pausar</>
                      ) : (
                        <><Play className="h-4 w-4 mr-1" /> Ativar</>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {processosMonitorados.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum processo em monitoramento.</p>
                <p className="text-sm">Adicione processos para receber atualizações automáticas.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
