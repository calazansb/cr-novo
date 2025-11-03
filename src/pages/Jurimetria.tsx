import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Search, TrendingUp, Scale, BarChart3 } from 'lucide-react';
import { useDecisoes } from '@/hooks/useDecisoes';
import PerfilMagistrado from '@/components/Jurimetria/PerfilMagistrado';

interface JurimetriaProps {
  onBack: () => void;
}

const Jurimetria: React.FC<JurimetriaProps> = ({ onBack }) => {
  const { decisoes, loading } = useDecisoes();
  const [magistradoSelecionado, setMagistradoSelecionado] = useState<string | null>(null);
  const [filtroTribunal, setFiltroTribunal] = useState<string>('todos');
  const [filtroBusca, setFiltroBusca] = useState('');

  // Extrair lista única de magistrados com estatísticas
  const magistrados = useMemo(() => {
    const contagem: { [key: string]: { count: number; tribunal: string; camara: string } } = {};
    
    decisoes.forEach(d => {
      if (!contagem[d.nome_magistrado]) {
        contagem[d.nome_magistrado] = {
          count: 0,
          tribunal: d.orgao,
          camara: d.vara_tribunal
        };
      }
      contagem[d.nome_magistrado].count++;
    });

    return Object.entries(contagem)
      .map(([nome, stats]) => ({
        nome,
        count: stats.count,
        tribunal: stats.tribunal,
        camara: stats.camara
      }))
      .sort((a, b) => b.count - a.count);
  }, [decisoes]);

  // Tribunais únicos para filtro
  const tribunais = useMemo(() => 
    [...new Set(decisoes.map(d => d.orgao))].sort(),
    [decisoes]
  );

  // Filtrar magistrados
  const magistradosFiltrados = useMemo(() => {
    return magistrados.filter(m => {
      if (filtroTribunal !== 'todos' && m.tribunal !== filtroTribunal) return false;
      if (filtroBusca && !m.nome.toLowerCase().includes(filtroBusca.toLowerCase())) return false;
      return true;
    });
  }, [magistrados, filtroTribunal, filtroBusca]);

  // Se um magistrado está selecionado, mostrar seu perfil
  if (magistradoSelecionado) {
    return (
      <PerfilMagistrado
        nomeMagistrado={magistradoSelecionado}
        onBack={() => setMagistradoSelecionado(null)}
      />
    );
  }

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
            <h1 className="text-3xl font-bold">Jurimetria - Perfil de Magistrados</h1>
            <p className="text-muted-foreground">Análise estatística de padrões decisórios</p>
          </div>
        </div>
        <Button 
          onClick={() => window.open('https://calazansrossi.sharepoint.com', '_blank')}
          variant="default"
          className="flex items-center gap-2"
        >
          <Scale className="h-4 w-4" />
          Banco de Jurisprudências
        </Button>
      </div>

      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Magistrados Analisados</CardTitle>
            <Scale className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{magistrados.length}</div>
            <p className="text-xs text-muted-foreground">
              {decisoes.length} decisões analisadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tribunais</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tribunais.length}</div>
            <p className="text-xs text-muted-foreground">
              Tribunais diferentes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Média por Magistrado</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {magistrados.length > 0 ? (decisoes.length / magistrados.length).toFixed(1) : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Decisões por magistrado
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Buscar Magistrado</CardTitle>
          <CardDescription>Filtre e selecione um magistrado para análise detalhada</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome do Magistrado</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Digite o nome..."
                  value={filtroBusca}
                  onChange={(e) => setFiltroBusca(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Tribunal</label>
              <Select value={filtroTribunal} onValueChange={setFiltroTribunal}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tribunais" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os tribunais</SelectItem>
                  {tribunais.map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Magistrados */}
      <Card>
        <CardHeader>
          <CardTitle>Magistrados ({magistradosFiltrados.length})</CardTitle>
          <CardDescription>Clique em um magistrado para ver análise detalhada</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : magistradosFiltrados.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum magistrado encontrado com os filtros aplicados
            </div>
          ) : (
            <div className="space-y-2">
              {magistradosFiltrados.map(magistrado => (
                <button
                  key={magistrado.nome}
                  onClick={() => setMagistradoSelecionado(magistrado.nome)}
                  className="w-full text-left p-4 rounded-lg border hover:bg-accent hover:border-primary transition-all duration-200 flex items-center justify-between group"
                >
                  <div className="flex-1">
                    <div className="font-semibold text-lg group-hover:text-primary transition-colors">
                      {magistrado.nome}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {magistrado.tribunal} • {magistrado.camara}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">
                      {magistrado.count}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      decisões
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Jurimetria;
