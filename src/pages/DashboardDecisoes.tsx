import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useDecisoes } from '@/hooks/useDecisoes';
import { SharePointLinkButton } from "@/components/Admin/SharePointLinkButton";
import { ArrowLeft, Download, Eye, Trash2, FileText, TrendingUp, Scale, Users, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface DashboardDecisoesProps {
  onBack: () => void;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF6B9D'];

const DashboardDecisoes: React.FC<DashboardDecisoesProps> = ({ onBack }) => {
  const { decisoes, loading, deletarDecisao, exportarParaCSV, exportarParaExcel } = useDecisoes();
  const [decisaoSelecionada, setDecisaoSelecionada] = useState<any>(null);
  
  // Filtros
  const [filtroMagistrado, setFiltroMagistrado] = useState<string>('todos');
  const [filtroCliente, setFiltroCliente] = useState<string>('todos');
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [filtroOrgao, setFiltroOrgao] = useState<string>('todos');
  const [filtroAdvogado, setFiltroAdvogado] = useState<string>('todos');
  const [filtroBusca, setFiltroBusca] = useState('');
  
  // Ordenação
  const [sortField, setSortField] = useState<'codigo' | 'data' | 'magistrado' | 'cliente' | 'advogado' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Listas únicas para filtros
  const magistrados = useMemo(() => 
    [...new Set(decisoes.map(d => d.nome_magistrado))].sort(),
    [decisoes]
  );
  
  const clientes = useMemo(() => 
    [...new Set(decisoes.map(d => d.nome_cliente))].sort(),
    [decisoes]
  );
  
  const tiposDecisao = useMemo(() => 
    [...new Set(decisoes.map(d => d.tipo_decisao))].sort(),
    [decisoes]
  );
  
  const orgaos = useMemo(() => 
    [...new Set(decisoes.map(d => d.orgao))].sort(),
    [decisoes]
  );

  const advogados = useMemo(() => 
    [...new Set(decisoes.map(d => d.profiles?.nome).filter(Boolean))].sort() as string[],
    [decisoes]
  );

  // Aplicar filtros e ordenação
  const decisoesFiltradas = useMemo(() => {
    let resultado = decisoes.filter(d => {
      if (filtroMagistrado !== 'todos' && d.nome_magistrado !== filtroMagistrado) return false;
      if (filtroCliente !== 'todos' && d.nome_cliente !== filtroCliente) return false;
      if (filtroTipo !== 'todos' && d.tipo_decisao !== filtroTipo) return false;
      if (filtroOrgao !== 'todos' && d.orgao !== filtroOrgao) return false;
      if (filtroAdvogado !== 'todos' && d.profiles?.nome !== filtroAdvogado) return false;
      if (filtroBusca && !d.numero_processo.toLowerCase().includes(filtroBusca.toLowerCase()) &&
          !d.codigo_unico.toLowerCase().includes(filtroBusca.toLowerCase())) return false;
      return true;
    });

    // Aplicar ordenação
    if (sortField) {
      resultado.sort((a, b) => {
        let aValue: any, bValue: any;
        
        switch (sortField) {
          case 'codigo':
            aValue = a.codigo_unico;
            bValue = b.codigo_unico;
            break;
          case 'data':
            aValue = new Date(a.data_criacao).getTime();
            bValue = new Date(b.data_criacao).getTime();
            break;
          case 'magistrado':
            aValue = a.nome_magistrado;
            bValue = b.nome_magistrado;
            break;
          case 'cliente':
            aValue = a.nome_cliente;
            bValue = b.nome_cliente;
            break;
          case 'advogado':
            aValue = a.profiles?.nome || '';
            bValue = b.profiles?.nome || '';
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
    }

    return resultado;
  }, [decisoes, filtroMagistrado, filtroCliente, filtroTipo, filtroOrgao, filtroAdvogado, filtroBusca, sortField, sortDirection]);

  // Estatísticas
  const estatisticasPorMagistrado = useMemo(() => {
    const contagem: { [key: string]: number } = {};
    decisoesFiltradas.forEach(d => {
      contagem[d.nome_magistrado] = (contagem[d.nome_magistrado] || 0) + 1;
    });
    return Object.entries(contagem)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [decisoesFiltradas]);

  const estatisticasPorTipo = useMemo(() => {
    const contagem: { [key: string]: number } = {};
    decisoesFiltradas.forEach(d => {
      contagem[d.tipo_decisao] = (contagem[d.tipo_decisao] || 0) + 1;
    });
    return Object.entries(contagem)
      .map(([name, value]) => ({ name, value }));
  }, [decisoesFiltradas]);

  const estatisticasPorOrgao = useMemo(() => {
    const contagem: { [key: string]: number } = {};
    decisoesFiltradas.forEach(d => {
      contagem[d.orgao] = (contagem[d.orgao] || 0) + 1;
    });
    return Object.entries(contagem)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [decisoesFiltradas]);

  const handleSort = (field: 'codigo' | 'data' | 'magistrado' | 'cliente' | 'advogado') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const renderSortIcon = (field: 'codigo' | 'data' | 'magistrado' | 'cliente' | 'advogado') => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3.5 w-3.5 ml-1 opacity-50" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="h-3.5 w-3.5 ml-1" /> 
      : <ArrowDown className="h-3.5 w-3.5 ml-1" />;
  };

  const limparFiltros = () => {
    setFiltroMagistrado('todos');
    setFiltroCliente('todos');
    setFiltroTipo('todos');
    setFiltroOrgao('todos');
    setFiltroAdvogado('todos');
    setFiltroBusca('');
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Dashboard - Decisões Judiciais</h1>
            <p className="text-muted-foreground">Análise e gestão de decisões</p>
          </div>
        </div>
        <div className="flex gap-2">
          <SharePointLinkButton />
          <Button 
            onClick={() => window.location.href = '/banco-jurisprudencias'}
            variant="default"
            className="flex items-center gap-2"
          >
            <Scale className="h-4 w-4" />
            Banco de Jurisprudências
          </Button>
          <Button onClick={exportarParaCSV} variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            CSV
          </Button>
          <Button onClick={exportarParaExcel} variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Excel
          </Button>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total de Decisões</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{decisoesFiltradas.length}</div>
            <p className="text-xs text-muted-foreground">
              {decisoes.length} decisões no total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Magistrados Únicos</CardTitle>
            <Scale className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{magistrados.length}</div>
            <p className="text-xs text-muted-foreground">
              Magistrados diferentes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Clientes Únicos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientes.length}</div>
            <p className="text-xs text-muted-foreground">
              Clientes atendidos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tipos de Decisão</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tiposDecisao.length}</div>
            <p className="text-xs text-muted-foreground">
              Tipos diferentes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Magistrados</CardTitle>
            <CardDescription>Decisões por magistrado</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={estatisticasPorMagistrado}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} fontSize={10} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#0088FE" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Decisões por Tipo</CardTitle>
            <CardDescription>Distribuição por tipo de decisão</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={estatisticasPorTipo}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {estatisticasPorTipo.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Filtros</CardTitle>
            <Button variant="ghost" size="sm" onClick={limparFiltros}>
              Limpar Filtros
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar</label>
              <Input
                placeholder="Protocolo ou processo..."
                value={filtroBusca}
                onChange={(e) => setFiltroBusca(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Magistrado</label>
              <Select value={filtroMagistrado} onValueChange={setFiltroMagistrado}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {magistrados.map(m => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Cliente</label>
              <Select value={filtroCliente} onValueChange={setFiltroCliente}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {clientes.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo Decisão</label>
              <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {tiposDecisao.map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Órgão</label>
              <Select value={filtroOrgao} onValueChange={setFiltroOrgao}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {orgaos.map(o => (
                    <SelectItem key={o} value={o}>{o}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Advogado</label>
              <Select value={filtroAdvogado} onValueChange={setFiltroAdvogado}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  <SelectItem value="todos">Todos</SelectItem>
                  {advogados.map(a => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Decisões */}
      <Card>
        <CardHeader>
          <CardTitle>Decisões Registradas ({decisoesFiltradas.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 cursor-pointer hover:bg-muted/50" onClick={() => handleSort('codigo')}>
                    <div className="flex items-center">
                      Protocolo {renderSortIcon('codigo')}
                    </div>
                  </th>
                  <th className="text-left p-2">Processo</th>
                  <th className="text-left p-2 cursor-pointer hover:bg-muted/50" onClick={() => handleSort('magistrado')}>
                    <div className="flex items-center">
                      Magistrado {renderSortIcon('magistrado')}
                    </div>
                  </th>
                  <th className="text-left p-2 cursor-pointer hover:bg-muted/50" onClick={() => handleSort('cliente')}>
                    <div className="flex items-center">
                      Cliente {renderSortIcon('cliente')}
                    </div>
                  </th>
                  <th className="text-left p-2">Tipo</th>
                  <th className="text-left p-2 cursor-pointer hover:bg-muted/50" onClick={() => handleSort('advogado')}>
                    <div className="flex items-center">
                      Registrado Por {renderSortIcon('advogado')}
                    </div>
                  </th>
                  <th className="text-left p-2 cursor-pointer hover:bg-muted/50" onClick={() => handleSort('data')}>
                    <div className="flex items-center">
                      Data {renderSortIcon('data')}
                    </div>
                  </th>
                  <th className="text-right p-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {decisoesFiltradas.map(decisao => (
                  <tr key={decisao.id} className="border-b hover:bg-muted/50">
                    <td className="p-2">
                      <Badge variant="outline">{decisao.codigo_unico}</Badge>
                    </td>
                    <td className="p-2 text-sm">{decisao.numero_processo}</td>
                    <td className="p-2 text-sm">{decisao.nome_magistrado}</td>
                    <td className="p-2 text-sm">{decisao.nome_cliente}</td>
                    <td className="p-2 text-sm">{decisao.tipo_decisao}</td>
                    <td className="p-2 text-sm">
                      <Badge variant="secondary">{decisao.profiles?.nome || 'N/A'}</Badge>
                    </td>
                    <td className="p-2 text-sm">
                      {new Date(decisao.data_criacao).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="p-2">
                      <div className="flex justify-end gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDecisaoSelecionada(decisao)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Detalhes da Decisão</DialogTitle>
                              <DialogDescription>
                                Protocolo: {decisao.codigo_unico}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-sm font-medium">Processo</p>
                                  <p className="text-sm text-muted-foreground">{decisao.numero_processo}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium">Comarca</p>
                                  <p className="text-sm text-muted-foreground">{decisao.comarca || 'N/A'}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium">Órgão</p>
                                  <p className="text-sm text-muted-foreground">{decisao.orgao}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium">Vara/Câmara/Turma</p>
                                  <p className="text-sm text-muted-foreground">{decisao.vara_tribunal}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium">Cliente</p>
                                  <p className="text-sm text-muted-foreground">{decisao.nome_cliente}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium">Tipo de Decisão</p>
                                  <p className="text-sm text-muted-foreground">{decisao.tipo_decisao}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium">Magistrado</p>
                                  <p className="text-sm text-muted-foreground">{decisao.nome_magistrado}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium">Advogado Interno</p>
                                  <p className="text-sm text-muted-foreground">{decisao.advogado_interno}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium">Adverso</p>
                                  <p className="text-sm text-muted-foreground">{decisao.adverso}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium">Objeto/Procedimento</p>
                                  <p className="text-sm text-muted-foreground">{decisao.procedimento_objeto}</p>
                                </div>
                              </div>
                              <div>
                                <p className="text-sm font-medium mb-2">Resumo da Decisão</p>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{decisao.resumo_decisao}</p>
                              </div>
                              <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                                <div>
                                  <p>Data de Registro: {new Date(decisao.data_criacao).toLocaleString('pt-BR')}</p>
                                </div>
                                <div>
                                  <p>Última Atualização: {new Date(decisao.data_atualizacao).toLocaleString('pt-BR')}</p>
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir a decisão {decisao.codigo_unico}?
                                Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deletarDecisao(decisao.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardDecisoes;