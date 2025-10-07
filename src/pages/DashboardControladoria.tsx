import React, { useState, useMemo } from 'react';
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
  
  // Novos estados para filtros avançados
  const [filtroNome, setFiltroNome] = useState('');
  const [filtroDataInicio, setFiltroDataInicio] = useState('');
  const [filtroDataFim, setFiltroDataFim] = useState('');

  // Lista de solicitantes únicos extraída das solicitações
  const solicitantesUnicos = useMemo(() => {
    const nomes = new Set(solicitacoes.map(s => s.nome_solicitante));
    return Array.from(nomes).sort();
  }, [solicitacoes]);

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
  
  // Verificar tabela ao montar o componente
  React.useEffect(() => {
    if (supabase) {
      verificarTabela();
      verificarAdmin();
    }
  }, []);
  // Aplicar todos os filtros
  const solicitacoesFiltradas = solicitacoes.filter(s => {
    // Filtro por status
    if (filtroStatus !== 'todos' && s.status !== filtroStatus) return false;
    
    // Filtro por nome do solicitante (exato match)
    if (filtroNome && filtroNome !== 'todos' && s.nome_solicitante !== filtroNome) return false;
    
    // Filtro por data de início
    if (filtroDataInicio) {
      const dataCriacao = new Date(s.data_criacao);
      const dataInicio = new Date(filtroDataInicio);
      if (dataCriacao < dataInicio) return false;
    }
    
    // Filtro por data de fim
    if (filtroDataFim) {
      const dataCriacao = new Date(s.data_criacao);
      const dataFim = new Date(filtroDataFim);
      dataFim.setHours(23, 59, 59, 999); // Incluir todo o dia
      if (dataCriacao > dataFim) return false;
    }
    
    return true;
  });
  const estatisticas = {
    total: solicitacoes.length,
    pendentes: solicitacoes.filter(s => s.status === 'pendente').length,
    concluidas: solicitacoes.filter(s => s.status === 'concluida').length,
    canceladas: solicitacoes.filter(s => s.status === 'cancelada').length
  };
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

      {/* Estatísticas e Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Estatísticas */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total de Solicitações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{estatisticas.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{estatisticas.pendentes}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{estatisticas.concluidas}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Canceladas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{estatisticas.canceladas}</div>
            </CardContent>
          </Card>
        </div>

        {/* Gráfico de Status */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Status</CardTitle>
            <CardDescription>Percentual de solicitações por situação</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Pendentes', value: estatisticas.pendentes, color: '#eab308' },
                    { name: 'Concluídas', value: estatisticas.concluidas, color: '#22c55e' },
                    { name: 'Canceladas', value: estatisticas.canceladas, color: '#ef4444' }
                  ].filter(item => item.value > 0)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {[
                    { name: 'Pendentes', value: estatisticas.pendentes, color: '#eab308' },
                    { name: 'Concluídas', value: estatisticas.concluidas, color: '#22c55e' },
                    { name: 'Canceladas', value: estatisticas.canceladas, color: '#ef4444' }
                  ].filter(item => item.value > 0).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Filtros Avançados */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
          <CardDescription>Refine sua busca por solicitações</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Filtro por Status */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger>
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

            {/* Filtro por Nome (Dropdown) */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome do Solicitante</label>
              <Select value={filtroNome} onValueChange={setFiltroNome}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o solicitante" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Solicitantes</SelectItem>
                  {solicitantesUnicos.map((nome) => (
                    <SelectItem key={nome} value={nome}>
                      {nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por Data Início */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Data Início</label>
              <Input
                type="date"
                value={filtroDataInicio}
                onChange={(e) => setFiltroDataInicio(e.target.value)}
              />
            </div>

            {/* Filtro por Data Fim */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Data Fim</label>
              <Input
                type="date"
                value={filtroDataFim}
                onChange={(e) => setFiltroDataFim(e.target.value)}
              />
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex justify-between items-center mt-4 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => {
                setFiltroStatus('todos');
                setFiltroNome('todos');
                setFiltroDataInicio('');
                setFiltroDataFim('');
              }}
            >
              Limpar Filtros
            </Button>
            
            <div className="flex gap-2">
              {supabase && tabelaExiste && (
                <Button variant="outline" onClick={carregarSolicitacoes}>
                  🔄 Recarregar
                </Button>
              )}
              <Button onClick={exportarParaCSV} variant="outline" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Exportar CSV
              </Button>
              <Button onClick={exportarParaExcel} className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Exportar Excel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contador de Resultados */}
      <div className="mb-4 text-sm text-muted-foreground">
        Exibindo {solicitacoesFiltradas.length} de {solicitacoes.length} solicitações
      </div>

      {/* Lista de Solicitações */}
      {loading ? <div className="text-center py-8">Carregando solicitações...</div> : <div className="grid gap-4">
          {solicitacoesFiltradas.map(solicitacao => <Card key={solicitacao.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base">{formatCodigo(solicitacao.codigo_unico)}</CardTitle>
                      <Badge className={statusColors[solicitacao.status]}>
                        {statusLabels[solicitacao.status]}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                      <div><span className="text-muted-foreground">Processo:</span> <span className="font-medium">{solicitacao.numero_processo || 'N/A'}</span></div>
                      <div><span className="text-muted-foreground">Cliente:</span> <span className="font-medium">{solicitacao.cliente}</span></div>
                      <div><span className="text-muted-foreground">Prazo:</span> <span className="font-medium">{solicitacao.prazo_retorno ? new Date(solicitacao.prazo_retorno).toLocaleDateString('pt-BR') : 'N/A'}</span></div>
                      <div><span className="text-muted-foreground">Solicitante:</span> <span className="font-medium">{solicitacao.nome_solicitante}</span></div>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">{solicitacao.objeto_solicitacao}</p>
                    {(solicitacao as any).ultima_modificacao_em && (
                      <p className="text-xs text-muted-foreground italic">
                        Última modificação: {new Date((solicitacao as any).ultima_modificacao_em).toLocaleString('pt-BR')}
                        {(solicitacao as any).modificador?.nome && ` por ${(solicitacao as any).modificador.nome}`}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      {solicitacao.anexos && Array.isArray(solicitacao.anexos) && solicitacao.anexos.length > 0 && (
                        <Badge variant="outline" className="flex items-center gap-1 text-blue-600 border-blue-300">
                          <Paperclip className="h-3 w-3" />
                          {solicitacao.anexos.length}
                        </Badge>
                      )}
                      {(solicitacao as any).anexos_resposta && Array.isArray((solicitacao as any).anexos_resposta) && (solicitacao as any).anexos_resposta.length > 0 && (
                        <Badge variant="outline" className="flex items-center gap-1 text-green-600 border-green-300">
                          <Upload className="h-3 w-3" />
                          {(solicitacao as any).anexos_resposta.length}
                        </Badge>
                      )}
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
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
                                {(solicitacao as any).anexos_resposta.map((url: string, idx: number) => (
                                  <a
                                    key={idx}
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 hover:underline hover:text-green-800 dark:hover:text-green-300 font-medium"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                    Abrir Resposta {idx + 1}
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
                          {solicitacao.observacoes && <div>
                              <label className="font-semibold">Observações:</label>
                              <p className="whitespace-pre-wrap">{solicitacao.observacoes}</p>
                            </div>}
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => {
                    setSolicitacaoEditando(solicitacao);
                    setNovoStatus(solicitacao.status);
                    setObservacoes(solicitacao.observacoes || '');
                    setArquivosResposta([]);
                  }}>
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
                          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
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
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">
                  <strong>Objeto:</strong> {solicitacao.objeto_solicitacao}
                </p>
                <p className="text-xs text-muted-foreground">
                  Criado em: {new Date(solicitacao.data_criacao).toLocaleString('pt-BR')}
                </p>
              </CardContent>
            </Card>)}
          
          {solicitacoesFiltradas.length === 0 && <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">Nenhuma solicitação encontrada.</p>
              </CardContent>
            </Card>}
        </div>}
      
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