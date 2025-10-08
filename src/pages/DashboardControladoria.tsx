import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useSolicitacoes } from '@/hooks/useSolicitacoes';
import { ArrowLeft, Download, Eye, Edit, AlertCircle, Trash2, Paperclip, ExternalLink, Upload, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { FileUpload } from '@/components/ui/file-upload';
import { useToast } from '@/hooks/use-toast';
import { formatCodigo } from '@/lib/utils';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

// Tipo para compatibilidade
type SolicitacaoControladoria = Database['public']['Tables']['solicitacoes_controladoria']['Row'];

import { Input } from '@/components/ui/input';
import SetupButton from '@/components/SetupButton';
import CreateTableButton from '@/components/CreateTableButton';
interface DashboardControladoriaProps {
  onBack: () => void;
}
const statusColors = {
  pendente: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  concluida: 'bg-green-100 text-green-800 border-green-200',
  cancelada: 'bg-red-100 text-red-800 border-red-200'
};
const statusLabels = {
  pendente: 'Pendente',
  concluida: 'Concluída',
  cancelada: 'Cancelada'
};
const DashboardControladoria: React.FC<DashboardControladoriaProps> = ({
  onBack
}) => {
  const {
    solicitacoes,
    loading,
    atualizarStatus,
    exportarParaCSV,
    exportarParaExcel,
    carregarSolicitacoes,
    deletarSolicitacao
  } = useSolicitacoes();
  const { toast } = useToast();
  const [solicitacaoEditando, setSolicitacaoEditando] = useState<SolicitacaoControladoria | null>(null);
  const [novoStatus, setNovoStatus] = useState<string>('');
  const [observacoes, setObservacoes] = useState('');
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [tabelaExiste, setTabelaExiste] = useState<boolean | null>(null);
  const [arquivosResposta, setArquivosResposta] = useState<File[]>([]);
  const [uploadingResposta, setUploadingResposta] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  // Estados para filtros avançados
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [filtroNome, setFiltroNome] = useState('');
  const [filtroCliente, setFiltroCliente] = useState('');
  const [filtroData, setFiltroData] = useState('');
  const [filtroPrazo, setFiltroPrazo] = useState('');
  
  // Estados temporários para os filtros (antes de aplicar)
  const [tempFiltroStatus, setTempFiltroStatus] = useState('todos');
  const [tempFiltroNome, setTempFiltroNome] = useState('');
  const [tempFiltroCliente, setTempFiltroCliente] = useState('');
  const [tempFiltroData, setTempFiltroData] = useState('');
  const [tempFiltroPrazo, setTempFiltroPrazo] = useState('');
  
  // Dados para os dropdowns
  const [advogados, setAdvogados] = useState<Array<{id: string, nome: string}>>([]);
  const [clientes, setClientes] = useState<Array<{id: string, nome: string}>>([]);
  
  // Estado de ordenação
  const [sortField, setSortField] = useState<'codigo' | 'solicitante' | 'cliente' | 'data' | 'prazo' | 'status' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Verificar se tabela existe
  const verificarTabela = async () => {
    if (!supabase) return false;
    try {
      console.log('🔍 Verificando se tabela existe...');
      const {
        data,
        error
      } = await supabase.from('solicitacoes_controladoria').select('id').limit(1);
      console.log('📊 Resultado verificação tabela:', {
        data,
        error
      });
      if (error && error.message.includes('does not exist')) {
        setTabelaExiste(false);
        return false;
      }
      setTabelaExiste(true);
      return true;
    } catch (error) {
      console.error('Erro ao verificar tabela:', error);
      setTabelaExiste(false);
      return false;
    }
  };
  
  // Verificar se usuário é admin
  const verificarAdmin = async () => {
    try {
      const { data, error } = await supabase.rpc('is_admin');
      if (!error && data === true) {
        setIsAdmin(true);
      }
    } catch (error) {
      console.error('Erro ao verificar admin:', error);
    }
  };
  
  // Obter usuário logado
  const obterUsuarioLogado = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    } catch (error) {
      console.error('Erro ao obter usuário:', error);
    }
  };
  
  // Verificar tabela ao montar o componente
  React.useEffect(() => {
    if (supabase) {
      verificarTabela();
      verificarAdmin();
      obterUsuarioLogado();
    }
  }, []);
  
  // Carregar advogados e clientes
  useEffect(() => {
    const carregarAdvogados = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, nome')
        .in('perfil', ['advogado', 'admin'])
        .order('nome');
      
      if (!error && data) {
        setAdvogados(data);
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
  }, []);
  
  // Função para ordenar solicitações
  const handleSort = (field: 'codigo' | 'solicitante' | 'cliente' | 'data' | 'prazo' | 'status') => {
    if (sortField === field) {
      // Se já está ordenando por este campo, inverte a direção
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Novo campo, começa com ascendente
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  // Renderizar ícone de ordenação
  const renderSortIcon = (field: 'codigo' | 'solicitante' | 'cliente' | 'data' | 'prazo' | 'status') => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3.5 w-3.5 ml-1 opacity-50" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="h-3.5 w-3.5 ml-1" /> 
      : <ArrowDown className="h-3.5 w-3.5 ml-1" />;
  };
  
  // Aplicar todos os filtros
  const solicitacoesFiltradas = solicitacoes.filter(s => {
    // Filtro por status
    if (filtroStatus !== 'todos' && s.status !== filtroStatus) return false;
    
    // Filtro por nome do solicitante (busca parcial no nome)
    if (filtroNome && filtroNome !== 'todos') {
      const advogadoSelecionado = advogados.find(a => a.id === filtroNome);
      if (advogadoSelecionado && s.nome_solicitante !== advogadoSelecionado.nome) {
        return false;
      }
    }
    
    // Filtro por cliente (busca parcial no nome)
    if (filtroCliente && filtroCliente !== 'todos') {
      const clienteSelecionado = clientes.find(c => c.id === filtroCliente);
      if (clienteSelecionado && s.cliente !== clienteSelecionado.nome) {
        return false;
      }
    }
    
    // Filtro por data (data_criacao)
    if (filtroData) {
      const dc = new Date(s.data_criacao);
      const dcStr = `${dc.getFullYear()}-${String(dc.getMonth() + 1).padStart(2, '0')}-${String(dc.getDate()).padStart(2, '0')}`;
      const [fy, fm, fd] = filtroData.split('-').map(Number);
      const dfStr = `${fy}-${String(fm).padStart(2, '0')}-${String(fd).padStart(2, '0')}`;
      if (dcStr !== dfStr) return false;
    }
    
    // Filtro por prazo (prazo_retorno)
    if (filtroPrazo && s.prazo_retorno) {
      const pr = new Date(s.prazo_retorno);
      const prStr = `${pr.getFullYear()}-${String(pr.getMonth() + 1).padStart(2, '0')}-${String(pr.getDate()).padStart(2, '0')}`;
      const [pfy, pfm, pfd] = filtroPrazo.split('-').map(Number);
      const pfStr = `${pfy}-${String(pfm).padStart(2, '0')}-${String(pfd).padStart(2, '0')}`;
      if (prStr !== pfStr) return false;
    }
    
    return true;
  })
  // Aplicar ordenação
  .sort((a, b) => {
    if (!sortField) return 0;
    
    let aValue: any;
    let bValue: any;
    
    switch (sortField) {
      case 'codigo':
        aValue = a.codigo_unico || '';
        bValue = b.codigo_unico || '';
        break;
      case 'solicitante':
        aValue = a.nome_solicitante || '';
        bValue = b.nome_solicitante || '';
        break;
      case 'cliente':
        aValue = a.cliente || '';
        bValue = b.cliente || '';
        break;
      case 'data':
        aValue = new Date(a.data_criacao).getTime();
        bValue = new Date(b.data_criacao).getTime();
        break;
      case 'prazo':
        aValue = a.prazo_retorno ? new Date(a.prazo_retorno).getTime() : 0;
        bValue = b.prazo_retorno ? new Date(b.prazo_retorno).getTime() : 0;
        break;
      case 'status':
        aValue = a.status || '';
        bValue = b.status || '';
        break;
      default:
        return 0;
    }
    
    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
    } else {
      return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
    }
  });
  
  // Função para aplicar os filtros
  const aplicarFiltros = () => {
    setFiltroStatus(tempFiltroStatus);
    setFiltroNome(tempFiltroNome);
    setFiltroCliente(tempFiltroCliente);
    setFiltroData(tempFiltroData);
    setFiltroPrazo(tempFiltroPrazo);
  };
  
  // Função para limpar filtros
  const limparFiltros = () => {
    setFiltroStatus('todos');
    setFiltroNome('');
    setFiltroCliente('');
    setFiltroData('');
    setFiltroPrazo('');
    setTempFiltroStatus('todos');
    setTempFiltroNome('');
    setTempFiltroCliente('');
    setTempFiltroData('');
    setTempFiltroPrazo('');
  };
  const estatisticas = {
    total: solicitacoes.length,
    pendentes: solicitacoes.filter(s => s.status === 'pendente').length,
    concluidas: solicitacoes.filter(s => s.status === 'concluida').length,
    canceladas: solicitacoes.filter(s => s.status === 'cancelada').length
  };

  // Solicitações recentes do usuário logado (últimas 6)
  const solicitacoesRecentes = useMemo(() => {
    if (!currentUserId) return [];
    return solicitacoes
      .filter(s => s.user_id === currentUserId)
      .sort((a, b) => new Date(b.data_criacao).getTime() - new Date(a.data_criacao).getTime())
      .slice(0, 6);
  }, [solicitacoes, currentUserId]);

  // Estatísticas de solicitações pendentes por tempo
  const estatisticasPendentesPorTempo = useMemo(() => {
    const now = new Date();
    const pendentesSolicitacoes = solicitacoes.filter(s => s.status === 'pendente');
    
    const menosDe3Dias = pendentesSolicitacoes.filter(s => {
      const diasDeCriacao = Math.floor((now.getTime() - new Date(s.data_criacao).getTime()) / (1000 * 60 * 60 * 24));
      return diasDeCriacao < 3;
    }).length;
    
    const maisde3Dias = pendentesSolicitacoes.filter(s => {
      const diasDeCriacao = Math.floor((now.getTime() - new Date(s.data_criacao).getTime()) / (1000 * 60 * 60 * 24));
      return diasDeCriacao >= 3 && diasDeCriacao < 5;
    }).length;
    
    const maisDe5Dias = pendentesSolicitacoes.filter(s => {
      const diasDeCriacao = Math.floor((now.getTime() - new Date(s.data_criacao).getTime()) / (1000 * 60 * 60 * 24));
      return diasDeCriacao >= 5;
    }).length;
    
    return {
      menosDe3Dias,
      maisde3Dias,
      maisDe5Dias
    };
  }, [solicitacoes]);
  const uploadArquivosResposta = async (codigoUnico: string, solicitacaoId: string): Promise<string[]> => {
    if (arquivosResposta.length === 0) return [];

    setUploadingResposta(true);
    const uploadedUrls: string[] = [];

    try {
      for (const file of arquivosResposta) {
        const fileName = `${codigoUnico}/respostas/${Date.now()}-${file.name}`;
        
        const { error: uploadError } = await supabase.storage
          .from('solicitacoes-anexos')
          .upload(fileName, file);

        if (uploadError) {
          console.error('Erro ao fazer upload:', uploadError);
          toast({
            title: "Erro no upload",
            description: `Não foi possível enviar o arquivo ${file.name}`,
            variant: "destructive"
          });
          continue;
        }

        // Preferir URL pública (se bucket for público), senão gerar URL assinada
        let finalUrl: string | null = null;
        const { data: publicUrl } = await supabase.storage
          .from('solicitacoes-anexos')
          .getPublicUrl(fileName);
        if (publicUrl?.publicUrl) {
          finalUrl = publicUrl.publicUrl;
        } else {
          const { data: signed } = await supabase.storage
            .from('solicitacoes-anexos')
            .createSignedUrl(fileName, 60 * 60 * 24 * 30); // 30 dias
          if (signed?.signedUrl) finalUrl = signed.signedUrl;
        }

        if (finalUrl) uploadedUrls.push(finalUrl);
      }

      // Atualizar o campo anexos_resposta na solicitação
      if (uploadedUrls.length > 0) {
        const { error } = await supabase
          .from('solicitacoes_controladoria')
          .update({ anexos_resposta: uploadedUrls } as any)
          .eq('id', solicitacaoId);

        if (error) {
          console.error('Erro ao salvar URLs:', error);
          toast({ title: 'Erro ao salvar anexos de resposta', description: error.message, variant: 'destructive' });
        } else {
          await carregarSolicitacoes();
        }
      }

      return uploadedUrls;
    } catch (error) {
      console.error('Erro durante upload:', error);
      return uploadedUrls;
    } finally {
      setUploadingResposta(false);
    }
  };

  const handleAtualizarStatus = async () => {
    if (solicitacaoEditando && novoStatus) {
      let uploadedCount = 0;
      // Fazer upload dos arquivos de resposta se houver
      if (arquivosResposta.length > 0) {
        const urls = await uploadArquivosResposta(solicitacaoEditando.codigo_unico, solicitacaoEditando.id);
        uploadedCount = urls.length;
        if (uploadedCount > 0) {
          toast({
            title: "Arquivos enviados!",
            description: `${uploadedCount} arquivo(s) de resposta anexado(s) com sucesso.`,
          });
        } else {
          toast({
            title: "Nenhum arquivo enviado",
            description: "Não foi possível anexar os arquivos de resposta.",
            variant: "destructive"
          });
        }
      }
      
      await atualizarStatus(solicitacaoEditando.id, novoStatus as SolicitacaoControladoria['status'], observacoes);
      setSolicitacaoEditando(null);
      setNovoStatus('');
      setObservacoes('');
      setArquivosResposta([]);
    }
  };
  return <div className="container mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        <h1 className="text-3xl font-bold">Dashboard - Balcão da Controladoria</h1>
        {!supabase && <Badge variant="destructive" className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Supabase não configurado
          </Badge>}
      </div>

        {!supabase ? <Card className="mb-6 border-orange-200 bg-orange-50">
          <CardContent className="pt-4 space-y-4">
            <div className="flex items-center gap-2 text-orange-800">
              <AlertCircle className="h-5 w-5" />
              <p className="text-sm">
                <strong>Aviso:</strong> O Supabase não está configurado. As solicitações enviadas não serão salvas no dashboard.
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <Input placeholder="Supabase URL (ex: https://xxxx.supabase.co)" value={supabaseUrl} onChange={e => setSupabaseUrl(e.target.value)} />
              <Input placeholder="Supabase Public ANON Key" type="password" value={supabaseKey} onChange={e => setSupabaseKey(e.target.value)} />
            </div>
            <Button onClick={() => {
          const url = supabaseUrl.trim();
          const key = supabaseKey.trim();
          if (!url || !key) return;
          try {
            window.localStorage.setItem('vite_supabase_url', url);
            window.localStorage.setItem('vite_supabase_anon_key', key);
            (window as any).VITE_SUPABASE_URL = url;
            (window as any).VITE_SUPABASE_ANON_KEY = key;
            window.location.reload();
          } catch (e) {
            console.error('Erro ao salvar config do Supabase', e);
          }
        }}>
              Salvar e Recarregar
            </Button>
          </CardContent>
        </Card> : <Card className="mb-6 border-blue-200 bg-blue-50">
          
        </Card>}

      {/* Barra Compacta: Estatísticas + Ações Rápidas */}
      <Card className="mb-6 shadow-sm">
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center justify-between gap-6">
            {/* Estatísticas Inline */}
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{estatisticas.pendentes}</div>
                <div className="text-xs text-muted-foreground">Pendentes</div>
              </div>
              <div className="h-8 w-px bg-border"></div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{estatisticas.concluidas}</div>
                <div className="text-xs text-muted-foreground">Concluídas</div>
              </div>
              <div className="h-8 w-px bg-border"></div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{estatisticas.total}</div>
                <div className="text-xs text-muted-foreground">Total</div>
              </div>
            </div>

            {/* Ações Rápidas */}
            <div className="flex items-center gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={carregarSolicitacoes}>
                🔄 Recarregar
              </Button>
              <Button onClick={exportarParaCSV} variant="outline" size="sm" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                CSV
              </Button>
              <Button onClick={exportarParaExcel} variant="outline" size="sm" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Excel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gráficos */}
      <div className="space-y-4 mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* Gráfico de Status */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2 pt-3">
              <CardTitle className="text-sm">Distribuição por Status</CardTitle>
              <CardDescription className="text-xs">Percentual por situação</CardDescription>
            </CardHeader>
            <CardContent className="pb-3">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Pendentes', value: estatisticas.pendentes, color: '#ef4444' },
                      { name: 'Concluídas', value: estatisticas.concluidas, color: '#2563eb' },
                      { name: 'Canceladas', value: estatisticas.canceladas, color: '#eab308' }
                    ].filter(item => item.value > 0)}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={70}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {[
                      { name: 'Pendentes', value: estatisticas.pendentes, color: '#ef4444' },
                      { name: 'Concluídas', value: estatisticas.concluidas, color: '#2563eb' },
                      { name: 'Canceladas', value: estatisticas.canceladas, color: '#eab308' }
                    ].filter(item => item.value > 0).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Gráfico de Pendentes por Tempo */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2 pt-3">
              <CardTitle className="text-sm">Pendentes por Tempo</CardTitle>
              <CardDescription className="text-xs">Distribuição por dias</CardDescription>
            </CardHeader>
            <CardContent className="pb-3">
              {estatisticas.pendentes === 0 ? (
                <div className="flex items-center justify-center h-[220px] text-xs text-muted-foreground">
                  Nenhuma solicitação pendente
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: '< 3 dias', value: estatisticasPendentesPorTempo.menosDe3Dias, color: '#22c55e' },
                        { name: '3-5 dias', value: estatisticasPendentesPorTempo.maisde3Dias, color: '#f59e0b' },
                        { name: '> 5 dias', value: estatisticasPendentesPorTempo.maisDe5Dias, color: '#ef4444' }
                      ].filter(item => item.value > 0)}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={70}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {[
                        { name: '< 3 dias', value: estatisticasPendentesPorTempo.menosDe3Dias, color: '#22c55e' },
                        { name: '3-5 dias', value: estatisticasPendentesPorTempo.maisde3Dias, color: '#f59e0b' },
                        { name: '> 5 dias', value: estatisticasPendentesPorTempo.maisDe5Dias, color: '#ef4444' }
                      ].filter(item => item.value > 0).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </div>


      {/* Título da seção de todas as solicitações */}
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-3">Todas as Solicitações</h2>
        
        {/* Filtros - Mesmo layout do Meu Dashboard */}
        <div className="space-y-2 mb-4 p-3 bg-muted/30 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Status</label>
              <select 
                className="w-full text-xs border rounded px-2 py-1.5 bg-background"
                value={tempFiltroStatus}
                onChange={(e) => setTempFiltroStatus(e.target.value)}
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
                value={tempFiltroNome}
                onChange={(e) => setTempFiltroNome(e.target.value)}
              >
                <option value="todos">Todos Solicitantes</option>
                {advogados.map(adv => (
                  <option key={adv.id} value={adv.id}>{adv.nome}</option>
                ))}
              </select>
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Cliente</label>
              <select 
                className="w-full text-xs border rounded px-2 py-1.5 bg-background"
                value={tempFiltroCliente}
                onChange={(e) => setTempFiltroCliente(e.target.value)}
              >
                <option value="todos">Todos Clientes</option>
                {clientes.map(cli => (
                  <option key={cli.id} value={cli.id}>{cli.nome}</option>
                ))}
              </select>
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Data de Criação</label>
              <input
                type="date"
                className="w-full text-xs border rounded px-2 py-1.5 bg-background"
                value={tempFiltroData}
                onChange={(e) => setTempFiltroData(e.target.value)}
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Prazo de Retorno</label>
              <input
                type="date"
                className="w-full text-xs border rounded px-2 py-1.5 bg-background"
                value={tempFiltroPrazo}
                onChange={(e) => setTempFiltroPrazo(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs px-3"
              onClick={limparFiltros}
            >
              Limpar
            </Button>
            
            <Button
              variant="default"
              size="sm"
              className="h-7 text-xs px-3"
              onClick={aplicarFiltros}
            >
              Aplicar
            </Button>
          </div>
        </div>
        
        <div className="text-sm text-muted-foreground">
          Exibindo {solicitacoesFiltradas.length} de {solicitacoes.length} solicitações
        </div>
      </div>

      {/* Lista de Solicitações em Formato de Tabela */}
      {loading ? (
        <div className="text-center py-8">Carregando solicitações...</div>
      ) : (
        <div className="border rounded-lg overflow-hidden bg-background">
          {/* Header da Tabela - CLICÁVEL para ordenar */}
          <div className="grid grid-cols-[400px_180px_180px_120px_120px_120px_100px] gap-0 px-6 py-3 bg-muted/50 border-b font-medium text-sm text-muted-foreground">
            <button 
              className="pr-4 border-r text-left hover:text-foreground transition-colors flex items-center"
              onClick={() => handleSort('codigo')}
            >
              Código / Processo / Objeto
              {renderSortIcon('codigo')}
            </button>
            <button 
              className="px-4 border-r text-center hover:text-foreground transition-colors flex items-center justify-center"
              onClick={() => handleSort('solicitante')}
            >
              Solicitante
              {renderSortIcon('solicitante')}
            </button>
            <button 
              className="px-4 border-r text-center hover:text-foreground transition-colors flex items-center justify-center"
              onClick={() => handleSort('cliente')}
            >
              Cliente
              {renderSortIcon('cliente')}
            </button>
            <button 
              className="px-4 border-r text-center hover:text-foreground transition-colors flex items-center justify-center"
              onClick={() => handleSort('data')}
            >
              Data
              {renderSortIcon('data')}
            </button>
            <button 
              className="px-4 border-r text-center hover:text-foreground transition-colors flex items-center justify-center"
              onClick={() => handleSort('prazo')}
            >
              Prazo
              {renderSortIcon('prazo')}
            </button>
            <button 
              className="px-4 border-r text-center hover:text-foreground transition-colors flex items-center justify-center"
              onClick={() => handleSort('status')}
            >
              Status
              {renderSortIcon('status')}
            </button>
            <div className="px-4 text-center">Ações</div>
          </div>
          
          {/* Linhas da Tabela */}
          {solicitacoesFiltradas.length === 0 ? (
            <div className="px-6 py-12 text-center text-muted-foreground">
              Nenhuma solicitação encontrada
            </div>
          ) : (
            solicitacoesFiltradas.map((solicitacao, index) => (
              <div 
                key={solicitacao.id} 
                className={`grid grid-cols-[400px_180px_180px_120px_120px_120px_100px] gap-0 px-6 py-4 items-start hover:bg-muted/30 transition-colors ${
                  index !== solicitacoesFiltradas.length - 1 ? 'border-b' : ''
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
                    {statusLabels[solicitacao.status]}
                  </Badge>
                </div>
                
                {/* Coluna 7: Ações */}
                <div className="px-4 flex flex-col items-center justify-start">
                  <div className="flex gap-1 justify-center items-center mb-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-primary/10"
                          title="Ver detalhes"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
...
                      </DialogContent>
                    </Dialog>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-primary/10"
                          onClick={() => {
                            setSolicitacaoEditando(solicitacao);
                            setNovoStatus(solicitacao.status);
                            setObservacoes(solicitacao.observacoes || '');
                            setArquivosResposta([]);
                          }}
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
...
                      </DialogContent>
                    </Dialog>
                    
                    {isAdmin && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
...
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                  
                  {/* Anexos abaixo dos botões */}
                  <div className="flex gap-2 justify-center items-center text-xs">
                    {solicitacao.anexos && Array.isArray(solicitacao.anexos) && solicitacao.anexos.length > 0 && (
                      <span className="flex items-center gap-0.5 text-blue-600" title={`${solicitacao.anexos.length} anexo(s)`}>
                        <Paperclip className="h-3.5 w-3.5" />
                        {solicitacao.anexos.length}
                      </span>
                    )}
                    {(solicitacao as any).anexos_resposta && Array.isArray((solicitacao as any).anexos_resposta) && (solicitacao as any).anexos_resposta.length > 0 && (
                      <span className="flex items-center gap-0.5 text-green-600" title={`${(solicitacao as any).anexos_resposta.length} resposta(s)`}>
                        <Upload className="h-3.5 w-3.5" />
                        {(solicitacao as any).anexos_resposta.length}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Dialog de Edição Controlado */}
      
      {/* Dialog de Edição Controlado */}
      {solicitacaoEditando && (
        <Dialog open={!!solicitacaoEditando} onOpenChange={(open) => {
          if (!open) {
            setSolicitacaoEditando(null);
            setNovoStatus('');
            setObservacoes('');
            setArquivosResposta([]);
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
                <Textarea value={observacoes} onChange={e => setObservacoes(e.target.value)} placeholder="Adicione observações sobre o status..." />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  <Paperclip className="h-4 w-4" />
                  Anexar Arquivos de Resposta (Opcional)
                </label>
                <FileUpload
                  files={arquivosResposta}
                  onFilesChange={setArquivosResposta}
                  maxFiles={5}
                  maxSize={10}
                  acceptedTypes={['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.xls', '.xlsx']}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Máximo 5 arquivos, 10MB cada
                </p>
              </div>
              <Button 
                onClick={handleAtualizarStatus} 
                className="w-full"
                disabled={uploadingResposta}
              >
                {uploadingResposta ? 'Enviando arquivos...' : 'Atualizar Status'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>;
};
export default DashboardControladoria;