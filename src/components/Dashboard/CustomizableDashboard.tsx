import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  Edit
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';

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
    defaultSize: 'large'
  },
  {
    type: 'recent-requests',
    title: 'Solicitações Recentes',
    description: 'Lista das últimas solicitações criadas',
    icon: FileText,
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
    defaultSize: 'small'
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

  // Carregar widgets salvos
  useEffect(() => {
    loadWidgets();
    fetchStats();
    fetchRecentRequests();
  }, [user]);

  const loadWidgets = () => {
    const saved = localStorage.getItem(`dashboard-widgets-${user?.id}`);
    if (saved) {
      setWidgets(JSON.parse(saved));
    } else {
      // Widgets padrão
      const defaultWidgets: Widget[] = [
        { id: '1', type: 'stats-overview', title: 'Visão Geral de Estatísticas', position: 0, size: 'large' },
        { id: '2', type: 'recent-requests', title: 'Solicitações Recentes', position: 1, size: 'medium' },
        { id: '3', type: 'quick-actions', title: 'Ações Rápidas', position: 2, size: 'small' }
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
      .limit(5);

    if (!error && data) {
      setRecentRequests(data);
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
        <CardHeader className="pb-3">
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
        <CardContent>
          {renderWidgetContent(widget.type)}
        </CardContent>
      </Card>
    );
  };

  const renderWidgetContent = (type: WidgetType) => {
    switch (type) {
      case 'stats-overview':
        return (
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-3xl font-bold text-warning">{stats.pending}</div>
              <div className="text-sm text-muted-foreground">Pendentes</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-3xl font-bold text-success">{stats.completed}</div>
              <div className="text-sm text-muted-foreground">Concluídas</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-3xl font-bold text-primary">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
          </div>
        );

      case 'recent-requests':
        return (
          <ScrollArea className="h-64">
            <div className="space-y-3">
              {recentRequests.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhuma solicitação encontrada
                </p>
              ) : (
                recentRequests.map((req) => (
                  <div key={req.id} className="p-3 border rounded-lg hover:bg-muted/50 transition-colors space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 space-y-1">
                        <p className="font-semibold text-sm">{req.codigo_unico}</p>
                        <div className="text-xs text-muted-foreground space-y-0.5">
                          <p><span className="font-medium">Processo:</span> {req.numero_processo || 'N/A'}</p>
                          <p><span className="font-medium">Cliente:</span> {req.cliente}</p>
                          <p><span className="font-medium">Prazo:</span> {req.prazo_retorno ? new Date(req.prazo_retorno).toLocaleDateString('pt-BR') : 'N/A'}</p>
                          <p className="line-clamp-1"><span className="font-medium">Solicitação:</span> {req.objeto_solicitacao}</p>
                        </div>
                      </div>
                      <Badge variant={req.status === 'pendente' ? 'secondary' : 'default'} className="shrink-0">
                        {req.status}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => {
                          // Navigate to view details
                          window.dispatchEvent(new CustomEvent('view-request', { detail: req.id }));
                        }}
                      >
                        <Eye className="mr-1 h-3 w-3" />
                        Ver
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          // Navigate to edit
                          window.dispatchEvent(new CustomEvent('edit-request', { detail: req.id }));
                        }}
                      >
                        <Edit className="mr-1 h-3 w-3" />
                        Editar
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        );

      case 'quick-actions':
        return (
          <div className="space-y-2">
            <Button 
              variant="outline" 
              className="w-full justify-start" 
              size="sm"
              onClick={() => window.dispatchEvent(new CustomEvent('navigate-to', { detail: 'balcao' }))}
            >
              <Plus className="mr-2 h-4 w-4" />
              Nova Solicitação
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start" 
              size="sm"
              onClick={() => window.dispatchEvent(new CustomEvent('navigate-to', { detail: 'dashboard-controladoria' }))}
            >
              <FileText className="mr-2 h-4 w-4" />
              Relatórios
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start" 
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
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <LayoutDashboard className="h-8 w-8" />
            Meu Dashboard
          </h2>
          <p className="text-muted-foreground">
            Personalize seu dashboard adicionando, removendo e reorganizando widgets
          </p>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Widget
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Adicionar Widget</DialogTitle>
              <DialogDescription>
                Escolha um widget para adicionar ao seu dashboard
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[500px] pr-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableWidgets.map((template) => {
                  const Icon = template.icon;
                  const isAdded = widgets.some(w => w.type === template.type);
                  
                  return (
                    <Card
                      key={template.type}
                      className={cn(
                        'cursor-pointer hover:shadow-md transition-all',
                        isAdded && 'opacity-50'
                      )}
                      onClick={() => !isAdded && addWidget(template)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <Icon className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <CardTitle className="text-sm">{template.title}</CardTitle>
                            <p className="text-xs text-muted-foreground mt-1">
                              {template.description}
                            </p>
                          </div>
                          {isAdded && (
                            <CheckCircle2 className="h-5 w-5 text-success" />
                          )}
                        </div>
                      </CardHeader>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>

      {widgets.length === 0 ? (
        <Card className="p-12 text-center">
          <LayoutDashboard className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-xl font-semibold mb-2">Seu dashboard está vazio</h3>
          <p className="text-muted-foreground mb-6">
            Comece adicionando widgets para personalizar sua visualização
          </p>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Primeiro Widget
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {widgets
            .sort((a, b) => a.position - b.position)
            .map(renderWidget)}
        </div>
      )}

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <GripVertical className="h-4 w-4" />
        <span>Arraste os widgets para reorganizá-los</span>
      </div>
    </div>
  );
};

export default CustomizableDashboard;
