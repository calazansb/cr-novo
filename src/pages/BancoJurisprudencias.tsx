import { useState } from "react";
import ModernHeader from "@/components/Layout/ModernHeader";
import ModernSidebar from "@/components/Layout/ModernSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Scale, Search, Filter, Calendar, Eye, Download } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useJurisprudencias } from "@/hooks/useJurisprudencias";
import { Skeleton } from "@/components/ui/skeleton";

export default function BancoJurisprudencias() {
  const [searchTerm, setSearchTerm] = useState("");
  const [tribunalFilter, setTribunalFilter] = useState("todos");
  const [areaFilter, setAreaFilter] = useState("todas");
  const [activeSection, setActiveSection] = useState<'custom-dashboard' | 'decisoes' | 'dashboard-decisoes' | 'dashboard-executivo' | 'dashboard-auditoria' | 'automacoes-juridicas' | 'jurimetria' | 'analytics' | 'pendencias' | 'calculo-prazos' | 'sugestoes-erros' | 'dashboard-sugestoes-erros' | 'assistencia' | 'dashboard-assistencia' | 'balcao' | 'dashboard-controladoria' | 'dashboard-hapvida' | 'admin-usuarios' | 'bulk-users' | 'hapvida' | 'hapvida-pendencias' | 'hapvida-solicitacoes' | 'hapvida-relatorios'>('custom-dashboard');
  const { jurisprudencias, loading, visualizarArquivo, baixarArquivo } = useJurisprudencias();

  const filteredJurisprudencias = jurisprudencias.filter(j => {
    const matchesSearch = searchTerm === "" || 
      j.ementa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.numero_processo.includes(searchTerm);
    
    const matchesTribunal = tribunalFilter === "todos" || j.tribunal === tribunalFilter;
    const matchesArea = areaFilter === "todas" || j.area === areaFilter;

    return matchesSearch && matchesTribunal && matchesArea;
  });

  return (
    <div className="min-h-screen bg-background">
      <ModernHeader />
      
      <div className="flex">
        <ModernSidebar activeSection={activeSection} onSectionChange={setActiveSection} />
        
        <div className="flex-1 container mx-auto px-4 py-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Scale className="h-8 w-8 text-purple-600" />
                Banco de Jurisprudências
              </h1>
              <p className="text-muted-foreground mt-2">
                Base de conhecimento com decisões, acórdãos e jurisprudências organizadas
              </p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtros de Busca
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Buscar</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Número do processo ou palavras-chave..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Tribunal</label>
                  <Select value={tribunalFilter} onValueChange={setTribunalFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tribunal" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os Tribunais</SelectItem>
                      <SelectItem value="TJSP">TJSP</SelectItem>
                      <SelectItem value="TRT-2">TRT-2</SelectItem>
                      <SelectItem value="TRF-3">TRF-3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Área</label>
                  <Select value={areaFilter} onValueChange={setAreaFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a área" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todas">Todas as Áreas</SelectItem>
                      <SelectItem value="Direito Civil">Direito Civil</SelectItem>
                      <SelectItem value="Direito Trabalhista">Direito Trabalhista</SelectItem>
                      <SelectItem value="Direito Tributário">Direito Tributário</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total</CardDescription>
                <CardTitle className="text-3xl">{jurisprudencias.length}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Tribunais</CardDescription>
                <CardTitle className="text-3xl">{new Set(jurisprudencias.map(j => j.tribunal)).size}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Áreas</CardDescription>
                <CardTitle className="text-3xl">{new Set(jurisprudencias.map(j => j.area)).size}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Filtrados</CardDescription>
                <CardTitle className="text-3xl">{filteredJurisprudencias.length}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          <div className="space-y-4">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-20 w-full" />
                  </CardHeader>
                </Card>
              ))
            ) : filteredJurisprudencias.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    {jurisprudencias.length === 0 
                      ? "Nenhuma jurisprudência cadastrada."
                      : "Nenhuma encontrada com os filtros."}
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredJurisprudencias.map((jurisprudencia) => (
                <Card key={jurisprudencia.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="font-mono">
                            {jurisprudencia.numero_processo}
                          </Badge>
                          <Badge className="bg-purple-500/10 text-purple-700">
                            {jurisprudencia.tribunal}
                          </Badge>
                          <Badge variant="secondary">
                            {jurisprudencia.area}
                          </Badge>
                          {jurisprudencia.resultado && (
                            <Badge 
                              className={
                                jurisprudencia.resultado === "Favorável" 
                                  ? "bg-green-500/10 text-green-700"
                                  : "bg-yellow-500/10 text-yellow-700"
                              }
                            >
                              {jurisprudencia.resultado}
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-lg">{jurisprudencia.ementa}</CardTitle>
                        <CardDescription className="flex items-center gap-4 text-sm flex-wrap">
                          {jurisprudencia.data_julgamento && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(jurisprudencia.data_julgamento).toLocaleDateString('pt-BR')}
                            </span>
                          )}
                          {jurisprudencia.relator && (
                            <span>Relator: {jurisprudencia.relator}</span>
                          )}
                        </CardDescription>
                      </div>
                      {jurisprudencia.arquivo_url && (
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => visualizarArquivo(jurisprudencia.arquivo_url!)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Ver
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => baixarArquivo(jurisprudencia.arquivo_url!, jurisprudencia.arquivo_nome || 'arquivo.pdf')}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Baixar
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
