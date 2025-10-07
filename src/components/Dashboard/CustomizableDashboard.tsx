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
  const [filtroDataInicio, setFiltroDataInicio] = useState('');
  const [filtroDataFim, setFiltroDataFim] = useState('');
  const [filtroPrazoInicio, setFiltroPrazoInicio] = useState('');
  const [filtroPrazoFim, setFiltroPrazoFim] = useState('');
  
  // Dialogs de Ver e Editar
  const [solicitacaoVisualizando, setSolicitacaoVisualizando] = useState<any | null>(null);
  const [solicitacaoEditando, setSolicitacaoEditando] = useState<any | null>(null);
  const [novoStatus, setNovoStatus] = useState<string>('');
  const [observacoes, setObservacoes] = useState('');

  // Carregar widgets salvos
  useEffect(() => {
    loadWidgets();
    fetchStats();
    fetchRecentRequests();
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
    const { data, error } = await supabase
      .from('solicitacoes_controladoria')
      .select('*')
      .order('data_criacao', { ascending: false })
      .limit(100); // Carrega mais para filtrar

    if (!error && data) {
      setRecentRequests(data);
    }
  };
  
  // Lista de solicitantes e clientes únicos
  const solicitantesUnicos = Array.from(new Set(recentRequests.map(s => s.nome_solicitante))).sort();
  const clientesUnicos = Array.from(new Set(recentRequests.map(s => s.cliente))).sort();
  
  // Aplicar filtros
  const requestsFiltradas = recentRequests.filter(req => {
    if (filtroStatus !== 'todos' && req.status !== filtroStatus) return false;
    if (filtroNome !== 'todos' && req.nome_solicitante !== filtroNome) return false;
    
    if (filtroDataInicio) {
      const dataCriacao = new Date(req.data_criacao);
      const dataInicio = new Date(filtroDataInicio);
      if (dataCriacao < dataInicio) return false;
    }
    
    if (filtroDataFim) {
      const dataCriacao = new Date(req.data_criacao);
      const dataFim = new Date(filtroDataFim);
      dataFim.setHours(23, 59, 59, 999);
      if (dataCriacao > dataFim) return false;
    }
    
    return true;
  }).slice(0, 5); // Mostra apenas os 5 primeiros após filtrar
  
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
        );

      case 'recent-requests':
        return (
          <div className="space-y-3">
            {/* Filtros */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <select 
                className="text-xs border rounded px-2 py-1 bg-background"
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
              >
                <option value="todos">Todos Status</option>
                <option value="pendente">Pendente</option>
                <option value="concluida">Concluída</option>
                <option value="cancelada">Cancelada</option>
              </select>
              
              <select 
                className="text-xs border rounded px-2 py-1 bg-background"
                value={filtroNome}
                onChange={(e) => setFiltroNome(e.target.value)}
              >
                <option value="todos">Todos Solicitantes</option>
                {solicitantesUnicos.map(nome => (
                  <option key={nome} value={nome}>{nome}</option>
                ))}
              </select>
              
              <input
                type="date"
                className="text-xs border rounded px-2 py-1 bg-background"
                value={filtroDataInicio}
                onChange={(e) => setFiltroDataInicio(e.target.value)}
                placeholder="Data início"
              />
              
              <input
                type="date"
                className="text-xs border rounded px-2 py-1 bg-background"
                value={filtroDataFim}
                onChange={(e) => setFiltroDataFim(e.target.value)}
                placeholder="Data fim"
              />
            </div>
            
            <ScrollArea className="h-56">
              {requestsFiltradas.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhuma solicitação encontrada
                </p>
              ) : (
                <div className="border rounded-lg overflow-hidden bg-background">
                  {/* Header da Tabela */}
                  <div className="grid grid-cols-[2fr_1.5fr_1.5fr_1.5fr_1fr_1fr_1fr_1fr] gap-4 px-6 py-3 bg-muted/50 border-b font-medium text-sm text-muted-foreground">
                    <div>Código</div>
                    <div>Solicitante</div>
                    <div>Cliente</div>
                    <div>Processo</div>
                    <div>Data</div>
                    <div>Prazo</div>
                    <div>Status</div>
                    <div className="text-right">Ações</div>
                  </div>
                  
                  {/* Linhas da Tabela */}
                  {requestsFiltradas.map((req, index) => (
                    <div 
                      key={req.id} 
                      className={`grid grid-cols-[2fr_1.5fr_1.5fr_1.5fr_1fr_1fr_1fr_1fr] gap-4 px-6 py-4 items-center hover:bg-muted/30 transition-colors ${
                        index !== requestsFiltradas.length - 1 ? 'border-b' : ''
                      }`}
                    >
                      {/* Coluna 1: Código + Objeto */}
                      <div>
                        <div className="font-semibold text-sm">{formatCodigo(req.codigo_unico)}</div>
                        <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{req.objeto_solicitacao || 'Sem descrição'}</div>
                      </div>
                      
                      {/* Coluna 2: Solicitante */}
                      <div className="text-sm">
                        {req.nome_solicitante}
                      </div>
                      
                      {/* Coluna 3: Cliente */}
                      <div className="text-sm">
                        {req.cliente}
                      </div>
                      
                      {/* Coluna 4: Processo */}
                      <div className="text-sm text-muted-foreground truncate">
                        {req.numero_processo || 'N/A'}
                      </div>
                      
                      {/* Coluna 5: Data */}
                      <div className="text-sm text-muted-foreground">
                        {new Date(req.data_criacao).toLocaleDateString('pt-BR')}
                      </div>
                      
                      {/* Coluna 6: Prazo */}
                      <div className="text-sm text-muted-foreground">
                        {req.prazo_retorno ? new Date(req.prazo_retorno).toLocaleDateString('pt-BR') : 'N/A'}
                      </div>
                      
                      {/* Coluna 7: Status */}
                      <div>
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
                      
                      {/* Coluna 8: Ações */}
                      <div>
                        <div className="flex gap-1 justify-end items-center mb-1">
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
                        <div className="flex gap-2 justify-end items-center text-xs">
                          {req.anexos && Array.isArray(req.anexos) && req.anexos.length > 0 && (
                            <span className="flex items-center gap-1 text-blue-600" title={`${req.anexos.length} anexo(s)`}>
                              <Paperclip className="h-3 w-3" />
                              {req.anexos.length}
                            </span>
                          )}
                          {req.anexos_resposta && Array.isArray(req.anexos_resposta) && req.anexos_resposta.length > 0 && (
                            <span className="flex items-center gap-1 text-green-600" title={`${req.anexos_resposta.length} resposta(s)`}>
                              <Upload className="h-3 w-3" />
                              {req.anexos_resposta.length}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                }
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
              <div className="flex justify-between text-sm">
                <span>Pendentes</span>
                <span className="font-medium">{stats.pending}</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-warning transition-all"
                  style={{ width: `${stats.total ? (stats.pending / stats.total) * 100 : 0}%` }}
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Concluídas</span>
                <span className="font-medium">{stats.completed}</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-success transition-all"
                  style={{ width: `${stats.total ? (stats.completed / stats.total) * 100 : 0}%` }}
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
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Solicitações Recentes
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                setFiltroStatus('todos');
                setFiltroNome('todos');
                setFiltroCliente('todos');
                setFiltroDataInicio('');
                setFiltroDataFim('');
                setFiltroPrazoInicio('');
                setFiltroPrazoFim('');
              }}
            >
              Limpar Filtros
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="space-y-3">
            {/* Filtros em Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos Status</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="concluida">Concluída</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filtroNome} onValueChange={setFiltroNome}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Solicitante" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos Solicitantes</SelectItem>
                  {solicitantesUnicos.map(nome => (
                    <SelectItem key={nome} value={nome}>{nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={filtroCliente} onValueChange={setFiltroCliente}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos Clientes</SelectItem>
                  {clientesUnicos.map(cliente => (
                    <SelectItem key={cliente} value={cliente}>{cliente}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Input
                type="date"
                className="h-9 text-xs"
                value={filtroDataInicio}
                onChange={(e) => setFiltroDataInicio(e.target.value)}
                placeholder="Data início"
              />
              
              <Input
                type="date"
                className="h-9 text-xs"
                value={filtroDataFim}
                onChange={(e) => setFiltroDataFim(e.target.value)}
                placeholder="Data fim"
              />
              
              <Input
                type="date"
                className="h-9 text-xs"
                value={filtroPrazoInicio}
                onChange={(e) => setFiltroPrazoInicio(e.target.value)}
                placeholder="Prazo início"
              />
              
              <Input
                type="date"
                className="h-9 text-xs"
                value={filtroPrazoFim}
                onChange={(e) => setFiltroPrazoFim(e.target.value)}
                placeholder="Prazo fim"
              />
            </div>
            
            {requestsFiltradas.length === 0 ? (
              <div className="px-6 py-12 text-center text-muted-foreground">
                Nenhuma solicitação encontrada
              </div>
            ) : (
            <div className="border rounded-lg overflow-hidden bg-background">
              {/* Header da Tabela - idêntico ao DashboardControladoria */}
              <div className="grid grid-cols-[2fr_1.5fr_1.5fr_1.5fr_1fr_1fr_1fr_1fr] gap-4 px-6 py-3 bg-muted/50 border-b font-medium text-sm text-muted-foreground">
                <div>Código</div>
                <div>Solicitante</div>
                <div>Cliente</div>
                <div>Processo</div>
                <div>Data</div>
                <div>Prazo</div>
                <div>Status</div>
                <div className="text-right">Ações</div>
              </div>

              {/* Linhas da Tabela - idênticas em layout */}
              {requestsFiltradas.map((solicitacao, index) => (
                <div 
                  key={solicitacao.id} 
                  className={`grid grid-cols-[2fr_1.5fr_1.5fr_1.5fr_1fr_1fr_1fr_1fr] gap-4 px-6 py-4 items-center hover:bg-muted/30 transition-colors ${
                    index !== requestsFiltradas.length - 1 ? 'border-b' : ''
                  }`}
                >
                  {/* Coluna 1: Código + Objeto */}
                  <div>
                    <div className="font-semibold text-sm">{formatCodigo(solicitacao.codigo_unico)}</div>
                    <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{solicitacao.objeto_solicitacao}</div>
                  </div>
                  
                  {/* Coluna 2: Solicitante */}
                  <div className="text-sm">
                    {solicitacao.nome_solicitante}
                  </div>
                  
                  {/* Coluna 3: Cliente */}
                  <div className="text-sm">
                    {solicitacao.cliente}
                  </div>
                  
                  {/* Coluna 4: Processo */}
                  <div className="text-sm text-muted-foreground truncate">
                    {solicitacao.numero_processo || 'N/A'}
                  </div>
                  
                  {/* Coluna 5: Data */}
                  <div className="text-sm text-muted-foreground">
                    {new Date(solicitacao.data_criacao).toLocaleDateString('pt-BR')}
                  </div>
                  
                  {/* Coluna 6: Prazo */}
                  <div className="text-sm text-muted-foreground">
                    {solicitacao.prazo_retorno ? new Date(solicitacao.prazo_retorno).toLocaleDateString('pt-BR') : 'N/A'}
                  </div>
                  
                  {/* Coluna 7: Status */}
                  <div>
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
                  
                  {/* Coluna 8: Ações */}
                  <div>
                    <div className="flex gap-1 justify-end items-center mb-1">
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
                    
                    {/* Anexos abaixo dos botões - idênticos */}
                    <div className="flex gap-2 justify-end items-center text-xs">
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
