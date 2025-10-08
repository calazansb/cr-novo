import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  LayoutDashboard, 
  Plus, 
  GripVertical, 
  X, 
  BarChart3, 
  FileText, 
  Calendar,
  AlertCircle,
  TrendingUp,
  Clock,
  Users,
  CheckCircle2,
  Eye,
  Edit,
  Paperclip,
  ExternalLink,
  Upload
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';
import { formatCodigo } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Tipos de widgets disponíveis
type WidgetType = 
  | 'stats-overview'
  | 'recent-requests'
  | 'status-chart'
  | 'quick-actions'
  | 'calendar-preview'
  | 'alerts'
  | 'team-activity';

interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  position: number;
  size: 'small' | 'medium' | 'large';
}

interface WidgetTemplate {
  type: WidgetType;
  title: string;
  description: string;
  icon: any;
  defaultSize: 'small' | 'medium' | 'large';
}

const availableWidgets: WidgetTemplate[] = [
  {
    type: 'stats-overview',
    title: 'Visão Geral de Estatísticas',
    description: 'Resumo de solicitações pendentes, concluídas e em andamento',
    icon: BarChart3,
    defaultSize: 'medium'
  },
  {
    type: 'status-chart',
    title: 'Gráfico de Status',
    description: 'Distribuição visual de solicitações por status',
    icon: TrendingUp,
    defaultSize: 'medium'
  },
  {
    type: 'quick-actions',
    title: 'Ações Rápidas',
    description: 'Atalhos para funcionalidades principais',
    icon: AlertCircle,
    defaultSize: 'medium'
  },
  {
    type: 'calendar-preview',
    title: 'Prazos Próximos',
    description: 'Visualização de prazos e audiências',
    icon: Calendar,
    defaultSize: 'medium'
  },
  {
    type: 'alerts',
    title: 'Alertas e Notificações',
    description: 'Avisos importantes e lembretes',
    icon: AlertCircle,
    defaultSize: 'small'
  },
  {
    type: 'team-activity',
    title: 'Atividade da Equipe',
    description: 'Últimas ações dos membros da equipe',
    icon: Users,
    defaultSize: 'medium'
  }
];

export const CustomizableDashboard = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [draggedWidget, setDraggedWidget] = useState<string | null>(null);
  const [stats, setStats] = useState({ pending: 0, completed: 0, total: 0 });
  const [recentRequests, setRecentRequests] = useState<any[]>([]);
  
  // Filtros
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [filtroNome, setFiltroNome] = useState('todos');
  const [filtroCliente, setFiltroCliente] = useState('todos');
  const [filtroData, setFiltroData] = useState('');
  const [filtroPrazo, setFiltroPrazo] = useState('');
  
  // Filtros temporários
  const [tempFiltroStatus, setTempFiltroStatus] = useState<string>('todos');
  const [tempFiltroNome, setTempFiltroNome] = useState('todos');
  const [tempFiltroCliente, setTempFiltroCliente] = useState('todos');
  const [tempFiltroData, setTempFiltroData] = useState('');
  const [tempFiltroPrazo, setTempFiltroPrazo] = useState('');
  
  // Dados para dropdowns
  const [advogados, setAdvogados] = useState<Array<{id: string, nome: string}>>([]);
  const [clientes, setClientes] = useState<Array<{id: string, nome: string}>>([]);
  
  // Dialogs de Ver e Editar
  const [solicitacaoVisualizando, setSolicitacaoVisualizando] = useState<any | null>(null);
  const [solicitacaoEditando, setSolicitacaoEditando] = useState<any | null>(null);
  const [novoStatus, setNovoStatus] = useState<string>('');
  const [observacoes, setObservacoes] = useState('');

  // Carregar widgets salvos e configurar filtro padrão do usuário logado
  useEffect(() => {
    loadWidgets();
    fetchStats();
    fetchRecentRequests();
    
    // Carregar advogados e clientes
    const carregarAdvogados = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, nome')
        .in('perfil', ['advogado', 'admin'])
        .order('nome');
      
      if (!error && data) {
        setAdvogados(data);
        
        // Definir automaticamente o filtro para o usuário logado
        if (user?.id) {
          const usuarioLogado = data.find(adv => adv.id === user.id);
          if (usuarioLogado) {
            setFiltroNome(usuarioLogado.id);
            setTempFiltroNome(usuarioLogado.id);
          }
        }
      }
    };
    
    const carregarClientes = async () => {
      const { data, error } = await supabase
        .from('clientes')
        .select('id, nome')
        .order('nome');
      
      if (!error && data) {
        setClientes(data);
      }
    };
    
    carregarAdvogados();
    carregarClientes();
  }, [user]);

  const loadWidgets = () => {
    const saved = localStorage.getItem(`dashboard-widgets-${user?.id}`);
    if (saved) {
      const parsed: Widget[] = JSON.parse(saved);
      const filtered = parsed.filter(w => w.type !== 'recent-requests');
      setWidgets(filtered);
      if (filtered.length !== parsed.length) {
        saveWidgets(filtered);
      }
    } else {
      // Widgets padrão: lado a lado (sem "Solicitações Recentes" como widget)
      const defaultWidgets: Widget[] = [
        { id: '1', type: 'stats-overview', title: 'Visão Geral de Estatísticas', position: 0, size: 'medium' },
        { id: '2', type: 'quick-actions', title: 'Ações Rápidas', position: 1, size: 'medium' }
      ];
      setWidgets(defaultWidgets);
      saveWidgets(defaultWidgets);
    }
  };

  const saveWidgets = (widgetsToSave: Widget[]) => {
    localStorage.setItem(`dashboard-widgets-${user?.id}`, JSON.stringify(widgetsToSave));
  };

  const fetchStats = async () => {
    const { data, error } = await supabase
      .from('solicitacoes_controladoria')
      .select('status');

    if (!error && data) {
      const pending = data.filter(s => s.status === 'pendente').length;
      const completed = data.filter(s => s.status === 'concluido').length;
      setStats({ pending, completed, total: data.length });
    }
  };

  const fetchRecentRequests = async () => {
    // Buscar apenas solicitações do usuário logado
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    
    if (!currentUser) return;
    
    const { data, error } = await supabase
      .from('solicitacoes_controladoria')
      .select('*')
      .eq('user_id', currentUser.id) // Filtrar apenas do usuário logado
      .order('data_criacao', { ascending: false })
      .limit(100);

    if (!error && data) {
      setRecentRequests(data);
    }
  };
  
  // Lista de solicitantes e clientes únicos (não mais usado diretamente)
  const solicitantesUnicos = Array.from(new Set(recentRequests.map(s => s.nome_solicitante))).sort();
  const clientesUnicos = Array.from(new Set(recentRequests.map(s => s.cliente))).sort();
  
  // Aplicar filtros com dados das tabelas
  const requestsFiltradas = recentRequests.filter(req => {
    if (filtroStatus !== 'todos' && req.status !== filtroStatus) return false;
    
    if (filtroNome !== 'todos' && filtroNome) {
      const advogadoSelecionado = advogados.find(a => a.id === filtroNome);
      if (advogadoSelecionado && req.nome_solicitante !== advogadoSelecionado.nome) {
        return false;
      }
    }
    
    if (filtroCliente !== 'todos' && filtroCliente) {
      const clienteSelecionado = clientes.find(c => c.id === filtroCliente);
      if (clienteSelecionado && req.cliente !== clienteSelecionado.nome) {
      return false;
      }
    }
    
    if (filtroData) {
      const dc = new Date(req.data_criacao);
      const dcStr = `${dc.getFullYear()}-${String(dc.getMonth() + 1).padStart(2, '0')}-${String(dc.getDate()).padStart(2, '0')}`;
      const [fy, fm, fd] = filtroData.split('-').map(Number);
      const dfStr = `${fy}-${String(fm).padStart(2, '0')}-${String(fd).padStart(2, '0')}`;
      if (dcStr !== dfStr) return false;
    }
    
    if (filtroPrazo && req.prazo_retorno) {
      const pr = new Date(req.prazo_retorno);
      const prStr = `${pr.getFullYear()}-${String(pr.getMonth() + 1).padStart(2, '0')}-${String(pr.getDate()).padStart(2, '0')}`;
      const [pfy, pfm, pfd] = filtroPrazo.split('-').map(Number);
      const pfStr = `${pfy}-${String(pfm).padStart(2, '0')}-${String(pfd).padStart(2, '0')}`;
      if (prStr !== pfStr) return false;
    }
    
    return true;
  }).slice(0, 10);
  
  // Funções de filtro
  const aplicarFiltros = () => {
    setFiltroStatus(tempFiltroStatus);
    setFiltroNome(tempFiltroNome);
    setFiltroCliente(tempFiltroCliente);
    setFiltroData(tempFiltroData);
    setFiltroPrazo(tempFiltroPrazo);
  };
  
  const limparFiltros = () => {
    setFiltroStatus('todos');
    setFiltroNome('todos');
    setFiltroCliente('todos');
    setFiltroData('');
    setFiltroPrazo('');
    setTempFiltroStatus('todos');
    setTempFiltroNome('todos');
    setTempFiltroCliente('todos');
    setTempFiltroData('');
    setTempFiltroPrazo('');
  };
  
  const handleAtualizarStatus = async () => {
    if (solicitacaoEditando && novoStatus) {
      try {
        const { error } = await supabase
          .from('solicitacoes_controladoria')
          .update({ 
            status: novoStatus,
            observacoes: observacoes
          })
          .eq('id', solicitacaoEditando.id);

        if (error) throw error;
        
        toast({
          title: 'Status atualizado',
          description: 'O status da solicitação foi atualizado com sucesso.'
        });
        
        setSolicitacaoEditando(null);
        setNovoStatus('');
        setObservacoes('');
        
        // Recarregar dados
        fetchRecentRequests();
        fetchStats();
      } catch (error) {
        console.error('Erro ao atualizar status:', error);
        toast({
          title: 'Erro ao atualizar',
          description: 'Não foi possível atualizar o status da solicitação.',
          variant: 'destructive'
        });
      }
    }
  };

  const addWidget = (template: WidgetTemplate) => {
    const newWidget: Widget = {
      id: Date.now().toString(),
      type: template.type,
      title: template.title,
      position: widgets.length,
      size: template.defaultSize
    };

    const updatedWidgets = [...widgets, newWidget];
    setWidgets(updatedWidgets);
    saveWidgets(updatedWidgets);
    setIsAddDialogOpen(false);

    toast({
      title: 'Widget adicionado',
      description: `${template.title} foi adicionado ao dashboard.`
    });
  };

  const removeWidget = (id: string) => {
    const updatedWidgets = widgets.filter(w => w.id !== id);
    setWidgets(updatedWidgets);
    saveWidgets(updatedWidgets);

    toast({
      title: 'Widget removido',
      description: 'O widget foi removido do dashboard.'
    });
  };

  const handleDragStart = (id: string) => {
    setDraggedWidget(id);
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedWidget || draggedWidget === targetId) return;

    const draggedIndex = widgets.findIndex(w => w.id === draggedWidget);
    const targetIndex = widgets.findIndex(w => w.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newWidgets = [...widgets];
    const [removed] = newWidgets.splice(draggedIndex, 1);
    newWidgets.splice(targetIndex, 0, removed);

    // Atualizar posições
    newWidgets.forEach((w, i) => w.position = i);

    setWidgets(newWidgets);
    saveWidgets(newWidgets);
  };

  const handleDragEnd = () => {
    setDraggedWidget(null);
  };

  const renderWidget = (widget: Widget) => {
    const sizeClass = {
      small: 'col-span-1',
      medium: 'col-span-1 md:col-span-2',
      large: 'col-span-1 md:col-span-3'
    }[widget.size];

    return (
      <Card
        key={widget.id}
        className={cn(
          'relative group hover:shadow-lg transition-all',
          sizeClass,
          draggedWidget === widget.id && 'opacity-50'
        )}
        draggable
        onDragStart={() => handleDragStart(widget.id)}
        onDragOver={(e) => handleDragOver(e, widget.id)}
        onDragEnd={handleDragEnd}
      >
        <CardHeader className="pb-2 pt-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
              <CardTitle className="text-base">{widget.title}</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => removeWidget(widget.id)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pb-3">
          {renderWidgetContent(widget.type)}
        </CardContent>
      </Card>
    );
  };

  const renderWidgetContent = (type: WidgetType) => {
    switch (type) {
      case 'stats-overview':
        return (
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-muted/50 rounded-lg shadow-[inset_0_2px_4px_hsl(var(--primary)/0.05),0_2px_8px_hsl(var(--primary)/0.08)] hover:shadow-[inset_0_2px_4px_hsl(var(--primary)/0.08),0_4px_12px_hsl(var(--primary)/0.12)] transition-all duration-300">
              <div className="text-2xl font-bold drop-shadow-[0_2px_4px_hsl(var(--primary)/0.2)]" style={{ color: 'hsl(var(--chart-1))' }}>{stats.pending}</div>
              <div className="text-xs text-muted-foreground font-medium">Pendentes</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg shadow-[inset_0_2px_4px_hsl(var(--primary)/0.05),0_2px_8px_hsl(var(--primary)/0.08)] hover:shadow-[inset_0_2px_4px_hsl(var(--primary)/0.08),0_4px_12px_hsl(var(--primary)/0.12)] transition-all duration-300">
              <div className="text-2xl font-bold drop-shadow-[0_2px_4px_hsl(var(--primary)/0.2)]" style={{ color: 'hsl(var(--chart-2))' }}>{stats.completed}</div>
              <div className="text-xs text-muted-foreground font-medium">Concluídas</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg shadow-[inset_0_2px_4px_hsl(var(--primary)/0.05),0_2px_8px_hsl(var(--primary)/0.08)] hover:shadow-[inset_0_2px_4px_hsl(var(--primary)/0.08),0_4px_12px_hsl(var(--primary)/0.12)] transition-all duration-300">
              <div className="text-2xl font-bold text-primary drop-shadow-[0_2px_4px_hsl(var(--primary)/0.2)]">{stats.total}</div>
              <div className="text-xs text-muted-foreground font-medium">Total</div>
            </div>
          </div>
        );

      case 'recent-requests':
        return (
          <div className="space-y-3">
            {/* Filtros */}
            <div className="space-y-2 mb-4 p-3 bg-muted/30 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Status</label>
                  <select 
                    className="w-full text-xs border rounded px-2 py-1.5 bg-background"
                    value={filtroStatus}
                    onChange={(e) => setFiltroStatus(e.target.value)}
                  >
                    <option value="todos">Todos Status</option>
                    <option value="pendente">Pendente</option>
                    <option value="concluida">Concluída</option>
                    <option value="cancelada">Cancelada</option>
                  </select>
                </div>
                
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Solicitante</label>
                  <select 
                    className="w-full text-xs border rounded px-2 py-1.5 bg-background"
                    value={filtroNome}
                    onChange={(e) => setFiltroNome(e.target.value)}
                  >
                    <option value="todos">Todos Solicitantes</option>
                    {solicitantesUnicos.map(nome => (
                      <option key={nome} value={nome}>{nome}</option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Cliente</label>
                  <select 
                    className="w-full text-xs border rounded px-2 py-1.5 bg-background"
                    value={filtroCliente}
                    onChange={(e) => setFiltroCliente(e.target.value)}
                  >
                    <option value="todos">Todos Clientes</option>
                    {clientesUnicos.map(nome => (
                      <option key={nome} value={nome}>{nome}</option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Data de Criação</label>
                  <input
                    type="date"
                    className="w-full text-xs border rounded px-2 py-1.5 bg-background"
                    value={filtroData}
                    onChange={(e) => setFiltroData(e.target.value)}
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Prazo de Retorno</label>
                  <input
                    type="date"
                    className="w-full text-xs border rounded px-2 py-1.5 bg-background"
                    value={filtroPrazo}
                    onChange={(e) => setFiltroPrazo(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs px-3"
                  onClick={() => {
                    setFiltroStatus('todos');
                    setFiltroNome('todos');
                    setFiltroCliente('todos');
                    setFiltroData('');
                    setFiltroPrazo('');
                  }}
                >
                  Limpar
                </Button>
              </div>
            </div>
            
            <ScrollArea className="h-56">
              {requestsFiltradas.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhuma solicitação encontrada
                </p>
              ) : (
                <div className="border rounded-lg overflow-hidden bg-background">
                  {/* Header da Tabela */}
                  <div className="grid grid-cols-[400px_180px_180px_120px_120px_120px_100px] gap-0 px-6 py-3 bg-muted/50 border-b font-semibold text-sm text-muted-foreground shadow-[0_2px_4px_hsl(var(--primary)/0.08)]">
                    <div className="pr-4 border-r drop-shadow-[0_1px_2px_hsl(var(--primary)/0.1)]">Código / Processo / Objeto</div>
                    <div className="px-4 border-r text-center drop-shadow-[0_1px_2px_hsl(var(--primary)/0.1)]">Solicitante</div>
                    <div className="px-4 border-r text-center drop-shadow-[0_1px_2px_hsl(var(--primary)/0.1)]">Cliente</div>
                    <div className="px-4 border-r text-center drop-shadow-[0_1px_2px_hsl(var(--primary)/0.1)]">Data</div>
                    <div className="px-4 border-r text-center drop-shadow-[0_1px_2px_hsl(var(--primary)/0.1)]">Prazo</div>
                    <div className="px-4 border-r text-center drop-shadow-[0_1px_2px_hsl(var(--primary)/0.1)]">Status</div>
                    <div className="px-4 text-center drop-shadow-[0_1px_2px_hsl(var(--primary)/0.1)]">Ações</div>
                  </div>
                  
                  {/* Linhas da Tabela */}
                  {requestsFiltradas.map((req, index) => (
                    <div 
                      key={req.id} 
                      className={`grid grid-cols-[400px_180px_180px_120px_120px_120px_100px] gap-0 px-6 py-4 items-start hover:bg-muted/30 hover:shadow-[0_2px_6px_hsl(var(--primary)/0.08)] transition-all duration-200 ${
                        index !== requestsFiltradas.length - 1 ? 'border-b' : ''
                      }`}
                    >
                      {/* Coluna 1: Código + Processo + Descrição Completa */}
                      <div className="pr-4 border-r">
                        <div className="font-semibold text-sm mb-1 break-words">{formatCodigo(req.codigo_unico)}</div>
                        {req.numero_processo && (
                          <div className="text-xs text-muted-foreground font-medium mb-1 break-words">
                            Processo: {req.numero_processo}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground">
                          <div className="font-medium mb-0.5 break-words">Objeto: {req.objeto_solicitacao || 'Sem descrição'}</div>
                          <div className="break-words whitespace-normal">{req.descricao_detalhada}</div>
                        </div>
                      </div>
                      
                      {/* Coluna 2: Solicitante */}
                      <div className="text-sm px-4 border-r text-center flex items-start justify-center">
                        <span className="break-words">{req.nome_solicitante}</span>
                      </div>
                      
                      {/* Coluna 3: Cliente */}
                      <div className="text-sm px-4 border-r text-center flex items-start justify-center">
                        <span className="break-words">{req.cliente}</span>
                      </div>
                      
                      {/* Coluna 4: Data */}
                      <div className="text-sm text-muted-foreground px-4 border-r text-center flex items-start justify-center">
                        {new Date(req.data_criacao).toLocaleDateString('pt-BR')}
                      </div>
                      
                      {/* Coluna 5: Prazo */}
                      <div className="text-sm text-muted-foreground px-4 border-r text-center flex items-start justify-center">
                        {req.prazo_retorno ? new Date(req.prazo_retorno).toLocaleDateString('pt-BR') : 'N/A'}
                      </div>
                      
                      {/* Coluna 6: Status */}
                      <div className="px-4 border-r flex items-start justify-center">
                        <Badge 
                          className={`text-xs px-2.5 py-0.5 ${
                            req.status === 'concluida' 
                              ? 'bg-green-600 hover:bg-green-700 text-white' 
                              : req.status === 'pendente' 
                              ? 'bg-red-600 hover:bg-red-700 text-white' 
                              : 'bg-gray-600 hover:bg-gray-700 text-white'
                          }`}
                        >
                          {req.status === 'pendente' ? 'Pendente' : req.status === 'concluida' ? 'Concluída' : 'Cancelada'}
                        </Badge>
                      </div>
                      
                      {/* Coluna 7: Ações */}
                      <div className="px-4 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-2">
                          <div className="flex gap-1 justify-center items-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-primary/10"
                              onClick={() => setSolicitacaoVisualizando(req)}
                              title="Ver detalhes"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-primary/10"
                              onClick={() => {
                                setSolicitacaoEditando(req);
                                setNovoStatus(req.status);
                                setObservacoes(req.observacoes || '');
                              }}
                              title="Editar"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        
                          {/* Anexos abaixo dos botões */}
                          <div className="flex gap-2 justify-center items-center text-xs mt-2">
                            {req.anexos && Array.isArray(req.anexos) && req.anexos.length > 0 && (
                              <span className="flex items-center gap-0.5 text-blue-600" title={`${req.anexos.length} anexo(s)`}>
                                <Paperclip className="h-3.5 w-3.5" />
                                {req.anexos.length}
                              </span>
                            )}
                            {req.anexos_resposta && Array.isArray(req.anexos_resposta) && req.anexos_resposta.length > 0 && (
                              <span className="flex items-center gap-0.5 text-green-600" title={`${req.anexos_resposta.length} resposta(s)`}>
                                <Upload className="h-3.5 w-3.5" />
                                {req.anexos_resposta.length}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        );

      case 'quick-actions':
        return (
          <div className="grid grid-cols-1 gap-2">
            <Button 
              variant="outline" 
              className="w-full justify-start h-9" 
              size="sm"
              onClick={() => window.dispatchEvent(new CustomEvent('navigate-to', { detail: 'balcao' }))}
            >
              <Plus className="mr-2 h-4 w-4" />
              Nova Solicitação
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start h-9" 
              size="sm"
              onClick={() => window.dispatchEvent(new CustomEvent('navigate-to', { detail: 'dashboard-controladoria' }))}
            >
              <FileText className="mr-2 h-4 w-4" />
              Relatórios
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start h-9" 
              size="sm"
              onClick={() => window.dispatchEvent(new CustomEvent('navigate-to', { detail: 'admin-usuarios' }))}
            >
              <Users className="mr-2 h-4 w-4" />
              Equipe
            </Button>
          </div>
        );

      case 'status-chart':
        return (
          <div className="space-y-3">
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-medium">
                <span className="drop-shadow-[0_1px_2px_hsl(var(--primary)/0.1)]">Pendentes</span>
                <span className="font-semibold drop-shadow-[0_1px_2px_hsl(var(--primary)/0.15)]">{stats.pending}</span>
              </div>
              <div className="w-full h-3 bg-muted rounded-full overflow-hidden shadow-[inset_0_2px_4px_hsl(var(--primary)/0.1)]">
                <div 
                  className="h-full transition-all duration-500 shadow-[0_0_8px_hsl(var(--chart-1)/0.5)]"
                  style={{ 
                    width: `${stats.total ? (stats.pending / stats.total) * 100 : 0}%`,
                    backgroundColor: 'hsl(var(--chart-1))'
                  }}
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-medium">
                <span className="drop-shadow-[0_1px_2px_hsl(var(--primary)/0.1)]">Concluídas</span>
                <span className="font-semibold drop-shadow-[0_1px_2px_hsl(var(--primary)/0.15)]">{stats.completed}</span>
              </div>
              <div className="w-full h-3 bg-muted rounded-full overflow-hidden shadow-[inset_0_2px_4px_hsl(var(--primary)/0.1)]">
                <div 
                  className="h-full transition-all duration-500 shadow-[0_0_8px_hsl(var(--chart-2)/0.5)]"
                  style={{ 
                    width: `${stats.total ? (stats.completed / stats.total) * 100 : 0}%`,
                    backgroundColor: 'hsl(var(--chart-2))'
                  }}
                />
              </div>
            </div>
          </div>
        );

      case 'calendar-preview':
        return (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhum prazo próximo</p>
          </div>
        );

      case 'alerts':
        return (
          <div className="space-y-2">
            <div className="flex items-start gap-2 p-2 bg-warning/10 border border-warning/20 rounded">
              <AlertCircle className="h-4 w-4 text-warning mt-0.5" />
              <div className="text-xs">
                <p className="font-medium">3 solicitações aguardando resposta</p>
              </div>
            </div>
          </div>
        );

      case 'team-activity':
        return (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhuma atividade recente</p>
          </div>
        );

      default:
        return <div className="text-sm text-muted-foreground">Widget em desenvolvimento</div>;
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <LayoutDashboard className="h-6 w-6" />
            Meu Dashboard
          </h2>
          <p className="text-sm text-muted-foreground">
            Visão geral e acesso rápido
          </p>
        </div>
      </div>

      {/* Layout Compacto: Estatísticas e Ações Rápidas lado a lado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Estatísticas */}
        <Card>
          <CardHeader className="pb-2 pt-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Visão Geral de Estatísticas
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-warning">{stats.pending}</div>
                <div className="text-xs text-muted-foreground">Pendentes</div>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-success">{stats.completed}</div>
                <div className="text-xs text-muted-foreground">Concluídas</div>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-primary">{stats.total}</div>
                <div className="text-xs text-muted-foreground">Total</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ações Rápidas */}
        <Card>
          <CardHeader className="pb-2 pt-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Ações Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3">
            <div className="grid grid-cols-1 gap-2">
              <Button 
                variant="outline" 
                className="w-full justify-start h-9" 
                size="sm"
                onClick={() => window.dispatchEvent(new CustomEvent('navigate-to', { detail: 'balcao' }))}
              >
                <Plus className="mr-2 h-4 w-4" />
                Nova Solicitação
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start h-9" 
                size="sm"
                onClick={() => window.dispatchEvent(new CustomEvent('navigate-to', { detail: 'dashboard-controladoria' }))}
              >
                <FileText className="mr-2 h-4 w-4" />
                Relatórios
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start h-9" 
                size="sm"
                onClick={() => window.dispatchEvent(new CustomEvent('navigate-to', { detail: 'admin-usuarios' }))}
              >
                <Users className="mr-2 h-4 w-4" />
                Equipe
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Solicitações Recentes - Largura Total */}
      <Card>
        <CardHeader className="pb-2 pt-3 space-y-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              Todas as Solicitações
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="space-y-3">
            {/* Filtros em Grid - Igual ao DashboardControladoria */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Status</label>
                <Select value={tempFiltroStatus} onValueChange={setTempFiltroStatus}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos Status</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="concluida">Concluída</SelectItem>
                    <SelectItem value="cancelada">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Solicitante</label>
                <Select value={tempFiltroNome || 'todos'} onValueChange={setTempFiltroNome}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos Solicitantes</SelectItem>
                    {advogados.map(adv => (
                      <SelectItem key={adv.id} value={adv.id}>{adv.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Cliente</label>
                <Select value={tempFiltroCliente || 'todos'} onValueChange={setTempFiltroCliente}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos Clientes</SelectItem>
                    {clientes.map(cli => (
                      <SelectItem key={cli.id} value={cli.id}>{cli.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Data de Criação</label>
                <Input
                  type="date"
                  className="h-9"
                  value={tempFiltroData}
                  onChange={(e) => setTempFiltroData(e.target.value)}
                  placeholder="dd/mm/aaaa"
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Data do Prazo</label>
                <Input
                  type="date"
                  className="h-9"
                  value={tempFiltroPrazo}
                  onChange={(e) => setTempFiltroPrazo(e.target.value)}
                  placeholder="dd/mm/aaaa"
                />
              </div>
            </div>
            
            {/* Botões de Aplicar e Limpar */}
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={limparFiltros}
              >
                Limpar
              </Button>
              
              <Button
                variant="default"
                size="sm"
                onClick={aplicarFiltros}
              >
                Aplicar
              </Button>
            </div>
            
            {/* Contador de solicitações */}
            <div className="text-sm text-muted-foreground">
              Exibindo {requestsFiltradas.length} de {recentRequests.length} solicitações
            </div>
            
            
            {requestsFiltradas.length === 0 ? (
              <div className="px-6 py-12 text-center text-muted-foreground">
                Nenhuma solicitação encontrada
              </div>
            ) : (
            <div className="border rounded-lg overflow-hidden bg-background">
              {/* Header da Tabela - igual ao DashboardControladoria */}
              <div className="grid grid-cols-[400px_180px_180px_120px_120px_120px_100px] gap-0 px-6 py-3 bg-muted/50 border-b font-medium text-sm text-muted-foreground">
                <div className="pr-4 border-r">Código / Processo / Objeto</div>
                <div className="px-4 border-r text-center">Solicitante</div>
                <div className="px-4 border-r text-center">Cliente</div>
                <div className="px-4 border-r text-center">Data</div>
                <div className="px-4 border-r text-center">Prazo</div>
                <div className="px-4 border-r text-center">Status</div>
                <div className="px-4 text-center">Ações</div>
              </div>

              {/* Linhas da Tabela - igual ao DashboardControladoria */}
              {requestsFiltradas.map((solicitacao, index) => (
                <div 
                  key={solicitacao.id} 
                  className={`grid grid-cols-[400px_180px_180px_120px_120px_120px_100px] gap-0 px-6 py-4 items-start hover:bg-muted/30 transition-colors ${
                    index !== requestsFiltradas.length - 1 ? 'border-b' : ''
                  }`}
                >
                  {/* Coluna 1: Código + Processo + Descrição Completa */}
                  <div className="pr-4 border-r space-y-1.5">
                    <div className="font-semibold text-sm break-words text-black">{formatCodigo(solicitacao.codigo_unico)}</div>
                    {solicitacao.numero_processo && (
                      <div className="text-xs text-black break-words">
                        <span className="font-bold">Processo:</span> {solicitacao.numero_processo}
                      </div>
                    )}
                    <div className="text-xs text-black">
                      <div className="break-words mb-1">
                        <span className="font-bold">Objeto:</span> {solicitacao.objeto_solicitacao}
                      </div>
                      <div className="break-words whitespace-normal">{solicitacao.descricao_detalhada}</div>
                    </div>
                  </div>
                  
                  {/* Coluna 2: Solicitante */}
                  <div className="text-sm px-4 border-r text-center flex items-start justify-center">
                    <span className="break-words text-black">{solicitacao.nome_solicitante}</span>
                  </div>
                  
                  {/* Coluna 3: Cliente */}
                  <div className="text-sm px-4 border-r text-center flex items-start justify-center">
                    <span className="break-words text-black">{solicitacao.cliente}</span>
                  </div>
                  
                  {/* Coluna 4: Data */}
                  <div className="text-sm text-black px-4 border-r text-center flex items-start justify-center">
                    {new Date(solicitacao.data_criacao).toLocaleDateString('pt-BR')}
                  </div>
                  
                  {/* Coluna 5: Prazo */}
                  <div className="text-sm text-black px-4 border-r text-center flex items-start justify-center">
                    {solicitacao.prazo_retorno ? new Date(solicitacao.prazo_retorno).toLocaleDateString('pt-BR') : 'N/A'}
                  </div>
                  
                  {/* Coluna 6: Status */}
                  <div className="px-4 border-r flex items-start justify-center">
                    <Badge 
                      className={`text-xs px-2.5 py-0.5 ${
                        solicitacao.status === 'concluida' 
                          ? 'bg-green-600 hover:bg-green-700 text-white' 
                          : solicitacao.status === 'pendente' 
                          ? 'bg-red-600 hover:bg-red-700 text-white' 
                          : 'bg-gray-600 hover:bg-gray-700 text-white'
                      }`}
                    >
                      {solicitacao.status === 'pendente' ? 'Pendente' : solicitacao.status === 'concluida' ? 'Concluída' : 'Cancelada'}
                    </Badge>
                  </div>
                  
                  {/* Coluna 7: Ações */}
                  <div className="px-4 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex gap-1 justify-center items-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-primary/10"
                          onClick={() => setSolicitacaoVisualizando(solicitacao)}
                          title="Ver detalhes"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-primary/10"
                          onClick={() => {
                            setSolicitacaoEditando(solicitacao);
                            setNovoStatus(solicitacao.status);
                            setObservacoes(solicitacao.observacoes || '');
                          }}
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    
                      {/* Anexos abaixo dos botões */}
                      <div className="flex gap-2 justify-center items-center text-xs mt-2">
                        {solicitacao.anexos && Array.isArray(solicitacao.anexos) && solicitacao.anexos.length > 0 && (
                          <span className="flex items-center gap-0.5 text-blue-600" title={`${solicitacao.anexos.length} anexo(s)`}>
                            <Paperclip className="h-3.5 w-3.5" />
                            {solicitacao.anexos.length}
                          </span>
                        )}
                        {solicitacao.anexos_resposta && Array.isArray(solicitacao.anexos_resposta) && solicitacao.anexos_resposta.length > 0 && (
                          <span className="flex items-center gap-0.5 text-green-600" title={`${solicitacao.anexos_resposta.length} resposta(s)`}>
                            <Upload className="h-3.5 w-3.5" />
                            {solicitacao.anexos_resposta.length}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            )}
          </div>
        </CardContent>
      </Card>

      
      {/* Dialog de Visualização */}
      {solicitacaoVisualizando && (
        <Dialog open={!!solicitacaoVisualizando} onOpenChange={(open) => !open && setSolicitacaoVisualizando(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalhes da Solicitação {formatCodigo(solicitacaoVisualizando.codigo_unico)}</DialogTitle>
              <DialogDescription>Informações completas da solicitação e anexos.</DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[600px] pr-4">
              <div className="space-y-4">
                <div>
                  <label className="font-semibold">Solicitante:</label>
                  <p>{solicitacaoVisualizando.nome_solicitante}</p>
                </div>
                <div>
                  <label className="font-semibold">Cliente:</label>
                  <p>{solicitacaoVisualizando.cliente}</p>
                </div>
                <div>
                  <label className="font-semibold">Processo:</label>
                  <p>{solicitacaoVisualizando.numero_processo || 'Não informado'}</p>
                </div>
                <div>
                  <label className="font-semibold">Objeto:</label>
                  <p>{solicitacaoVisualizando.objeto_solicitacao}</p>
                </div>
                <div>
                  <label className="font-semibold">Descrição:</label>
                  <p className="whitespace-pre-wrap">{solicitacaoVisualizando.descricao_detalhada}</p>
                </div>
                
                {/* Arquivos Anexados */}
                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <label className="font-semibold flex items-center gap-2 text-blue-700 dark:text-blue-400">
                    <Paperclip className="h-4 w-4" />
                    Arquivos Anexados
                  </label>
                  {solicitacaoVisualizando.anexos && Array.isArray(solicitacaoVisualizando.anexos) && solicitacaoVisualizando.anexos.length > 0 ? (
                    <ul className="mt-2 space-y-1">
                      {solicitacaoVisualizando.anexos.map((url: string, i: number) => (
                        <li key={i}>
                          <a 
                            href={url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Arquivo {i + 1}
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground mt-2">Nenhum arquivo anexado</p>
                  )}
                </div>
                
                {/* Arquivos de Resposta */}
                {solicitacaoVisualizando.anexos_resposta && Array.isArray(solicitacaoVisualizando.anexos_resposta) && solicitacaoVisualizando.anexos_resposta.length > 0 && (
                  <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <label className="font-semibold flex items-center gap-2 text-green-700 dark:text-green-400">
                      <Upload className="h-4 w-4" />
                      Arquivos de Resposta da Controladoria
                    </label>
                    <ul className="mt-2 space-y-1">
                      {solicitacaoVisualizando.anexos_resposta.map((url: string, i: number) => (
                        <li key={i}>
                          <a 
                            href={url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-green-600 hover:text-green-800 flex items-center gap-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Resposta {i + 1}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div>
                  <label className="font-semibold">Data de Criação:</label>
                  <p>{new Date(solicitacaoVisualizando.data_criacao).toLocaleString('pt-BR')}</p>
                </div>
                {solicitacaoVisualizando.observacoes && (
                  <div>
                    <label className="font-semibold">Observações:</label>
                    <p className="whitespace-pre-wrap">{solicitacaoVisualizando.observacoes}</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Dialog de Edição */}
      {solicitacaoEditando && (
        <Dialog open={!!solicitacaoEditando} onOpenChange={(open) => {
          if (!open) {
            setSolicitacaoEditando(null);
            setNovoStatus('');
            setObservacoes('');
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Status - {solicitacaoEditando.codigo_unico}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Status:</label>
                <Select value={novoStatus} onValueChange={setNovoStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="concluida">Concluída</SelectItem>
                    <SelectItem value="cancelada">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Observações:</label>
                <Textarea 
                  value={observacoes} 
                  onChange={e => setObservacoes(e.target.value)} 
                  placeholder="Adicione observações sobre o status..." 
                  rows={4}
                />
              </div>
              <Button 
                onClick={handleAtualizarStatus} 
                className="w-full"
              >
                Atualizar Status
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default CustomizableDashboard;
