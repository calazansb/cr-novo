import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useSolicitacoes } from '@/hooks/useSolicitacoes';
import { ArrowLeft, Download, Eye, Edit, AlertCircle, Trash2, Paperclip, ExternalLink, Upload } from 'lucide-react';
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
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
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
  const [filtroNome, setFiltroNome] = useState('');
  const [filtroCliente, setFiltroCliente] = useState('');
  const [filtroDataInicio, setFiltroDataInicio] = useState('');
  const [filtroDataFim, setFiltroDataFim] = useState('');
  const [filtroPrazoInicio, setFiltroPrazoInicio] = useState('');
  const [filtroPrazoFim, setFiltroPrazoFim] = useState('');
  
  // Estados temporários para os filtros (antes de aplicar)
  const [tempFiltroStatus, setTempFiltroStatus] = useState('todos');
  const [tempFiltroNome, setTempFiltroNome] = useState('');
  const [tempFiltroCliente, setTempFiltroCliente] = useState('');
  const [tempFiltroDataInicio, setTempFiltroDataInicio] = useState('');
  const [tempFiltroDataFim, setTempFiltroDataFim] = useState('');
  const [tempFiltroPrazoInicio, setTempFiltroPrazoInicio] = useState('');
  const [tempFiltroPrazoFim, setTempFiltroPrazoFim] = useState('');
  
  // Dados para os dropdowns
  const [advogados, setAdvogados] = useState<Array<{id: string, nome: string}>>([]);
  const [clientes, setClientes] = useState<Array<{id: string, nome: string}>>([]);

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
    
    // Filtro por data de início (data_criacao)
    if (filtroDataInicio) {
      const dataCriacao = new Date(s.data_criacao);
      const dataInicio = new Date(filtroDataInicio);
      if (dataCriacao < dataInicio) return false;
    }
    
    // Filtro por data de fim (data_criacao)
    if (filtroDataFim) {
      const dataCriacao = new Date(s.data_criacao);
      const dataFim = new Date(filtroDataFim);
      dataFim.setHours(23, 59, 59, 999);
      if (dataCriacao > dataFim) return false;
    }
    
    // Filtro por prazo de início (prazo_retorno)
    if (filtroPrazoInicio && s.prazo_retorno) {
      const prazoRetorno = new Date(s.prazo_retorno);
      const prazoInicio = new Date(filtroPrazoInicio);
      if (prazoRetorno < prazoInicio) return false;
    }
    
    // Filtro por prazo de fim (prazo_retorno)
    if (filtroPrazoFim && s.prazo_retorno) {
      const prazoRetorno = new Date(s.prazo_retorno);
      const prazoFim = new Date(filtroPrazoFim);
      prazoFim.setHours(23, 59, 59, 999);
      if (prazoRetorno > prazoFim) return false;
    }
    
    return true;
  });
  
  // Função para aplicar os filtros
  const aplicarFiltros = () => {
    setFiltroStatus(tempFiltroStatus);
    setFiltroNome(tempFiltroNome);
    setFiltroCliente(tempFiltroCliente);
    setFiltroDataInicio(tempFiltroDataInicio);
    setFiltroDataFim(tempFiltroDataFim);
    setFiltroPrazoInicio(tempFiltroPrazoInicio);
    setFiltroPrazoFim(tempFiltroPrazoFim);
  };
  
  // Função para limpar filtros
  const limparFiltros = () => {
    setFiltroStatus('todos');
    setFiltroNome('');
    setFiltroCliente('');
    setFiltroDataInicio('');
    setFiltroDataFim('');
    setFiltroPrazoInicio('');
    setFiltroPrazoFim('');
    setTempFiltroStatus('todos');
    setTempFiltroNome('');
    setTempFiltroCliente('');
    setTempFiltroDataInicio('');
    setTempFiltroDataFim('');
    setTempFiltroPrazoInicio('');
    setTempFiltroPrazoFim('');
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

      {/* Estatísticas e Gráficos */}
      <div className="space-y-4 mb-6">

        {/* Gráficos e Filtros lado a lado */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Filtros */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2 pt-3">
              <CardTitle className="text-sm">Filtros</CardTitle>
              <CardDescription className="text-xs">Refine sua busca</CardDescription>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="space-y-3">
                {/* Filtro por Status */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Status</label>
                  <Select value={tempFiltroStatus} onValueChange={setTempFiltroStatus}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Filtrar por status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="pendente">Pendentes</SelectItem>
                      <SelectItem value="concluida">Concluídas</SelectItem>
                      <SelectItem value="cancelada">Canceladas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtro por Solicitante (Advogados/Admins) */}
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

                {/* Filtro por Cliente */}
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

                {/* Filtro por Data Início */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Data Início</label>
                  <Input
                    type="date"
                    className="h-9"
                    value={tempFiltroDataInicio}
                    onChange={(e) => setTempFiltroDataInicio(e.target.value)}
                  />
                </div>

                {/* Filtro por Data Fim */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Data Fim</label>
                  <Input
                    type="date"
                    className="h-9"
                    value={tempFiltroDataFim}
                    onChange={(e) => setTempFiltroDataFim(e.target.value)}
                  />
                </div>

                {/* Filtro por Prazo Início */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Prazo Início</label>
                  <Input
                    type="date"
                    className="h-9"
                    value={tempFiltroPrazoInicio}
                    onChange={(e) => setTempFiltroPrazoInicio(e.target.value)}
                  />
                </div>

                {/* Filtro por Prazo Fim */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Prazo Fim</label>
                  <Input
                    type="date"
                    className="h-9"
                    value={tempFiltroPrazoFim}
                    onChange={(e) => setTempFiltroPrazoFim(e.target.value)}
                  />
                </div>

                {/* Botões de Aplicar e Limpar */}
                <div className="space-y-2">
                  <Button
                    variant="default"
                    size="sm"
                    className="w-full h-9"
                    onClick={aplicarFiltros}
                  >
                    Aplicar Filtros
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full h-9"
                    onClick={limparFiltros}
                  >
                    Limpar Filtros
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

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
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Todas as Solicitações</h2>
        <div className="text-sm text-muted-foreground">
          Exibindo {solicitacoesFiltradas.length} de {solicitacoes.length} solicitações
        </div>
      </div>

      {/* Lista de Solicitações em Formato de Tabela */}
      {loading ? (
        <div className="text-center py-8">Carregando solicitações...</div>
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
          {solicitacoesFiltradas.length === 0 ? (
            <div className="px-6 py-12 text-center text-muted-foreground">
              Nenhuma solicitação encontrada
            </div>
          ) : (
            solicitacoesFiltradas.map((solicitacao, index) => (
              <div 
                key={solicitacao.id} 
                className={`grid grid-cols-[2fr_1.5fr_1.5fr_1.5fr_1fr_1fr_1fr_1fr] gap-4 px-6 py-4 items-center hover:bg-muted/30 transition-colors ${
                  index !== solicitacoesFiltradas.length - 1 ? 'border-b' : ''
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
                    {statusLabels[solicitacao.status]}
                  </Badge>
                </div>
                
                {/* Coluna 8: Ações */}
                <div>
                  <div className="flex gap-1 justify-end items-center mb-1">
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
                        <DialogHeader>
                          <DialogTitle>Detalhes da Solicitação {formatCodigo(solicitacao.codigo_unico)}</DialogTitle>
                          <DialogDescription>Informações completas da solicitação e anexos.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <label className="font-semibold">Solicitante:</label>
                            <p>{solicitacao.nome_solicitante}</p>
                          </div>
                          <div>
                            <label className="font-semibold">Cliente:</label>
                            <p>{solicitacao.cliente}</p>
                          </div>
                          <div>
                            <label className="font-semibold">Processo:</label>
                            <p>{solicitacao.numero_processo || 'Não informado'}</p>
                          </div>
                          <div>
                            <label className="font-semibold">Objeto:</label>
                            <p>{solicitacao.objeto_solicitacao}</p>
                          </div>
                          <div>
                            <label className="font-semibold">Descrição:</label>
                            <p className="whitespace-pre-wrap">{solicitacao.descricao_detalhada}</p>
                          </div>
                          
                          {/* Seção de Arquivos Anexados pelo Advogado */}
                          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                            <label className="font-semibold flex items-center gap-2 text-blue-700 dark:text-blue-400">
                              <Paperclip className="h-4 w-4" />
                              Arquivos Anexados
                            </label>
                            {solicitacao.anexos && Array.isArray(solicitacao.anexos) && solicitacao.anexos.length > 0 ? (
                              <div className="space-y-2 mt-3">
                                {solicitacao.anexos.map((url: any, idx: number) => (
                                  <a
                                    key={idx}
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                    Abrir Arquivo {idx + 1}
                                  </a>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground mt-2">Nenhum arquivo anexado</p>
                            )}
                          </div>

                          {/* Seção de Arquivos de Resposta da Controladoria */}
                          <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                            <label className="font-semibold flex items-center gap-2 text-green-700 dark:text-green-400">
                              <Upload className="h-4 w-4" />
                              Arquivos de Resposta
                            </label>
                            {(solicitacao as any).anexos_resposta && Array.isArray((solicitacao as any).anexos_resposta) && (solicitacao as any).anexos_resposta.length > 0 ? (
                              <div className="space-y-2 mt-3">
                                {(solicitacao as any).anexos_resposta.map((url: any, idx: number) => (
                                  <a
                                    key={idx}
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 hover:underline hover:text-green-800 dark:hover:text-green-300 font-medium"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                    Abrir Arquivo de Resposta {idx + 1}
                                  </a>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground mt-2">Nenhum arquivo de resposta anexado</p>
                            )}
                          </div>

                          <div>
                            <label className="font-semibold">Data de Criação:</label>
                            <p>{new Date(solicitacao.data_criacao).toLocaleString('pt-BR')}</p>
                          </div>
                          {solicitacao.observacoes && (
                            <div>
                              <label className="font-semibold">Observações:</label>
                              <p className="whitespace-pre-wrap">{solicitacao.observacoes}</p>
                            </div>
                          )}
                        </div>
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
                        <DialogHeader>
                          <DialogTitle>Editar Status - {solicitacao.codigo_unico}</DialogTitle>
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
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir a solicitação <strong>{solicitacao.codigo_unico}</strong>?
                              <br />
                              Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deletarSolicitacao(solicitacao.id)} className="bg-red-600 hover:bg-red-700">
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                  
                  {/* Anexos abaixo dos botões */}
                  <div className="flex gap-2 justify-end items-center text-xs">
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