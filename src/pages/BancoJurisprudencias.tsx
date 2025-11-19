import { useState } from "react";
import ModernHeader from "@/components/Layout/ModernHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Scale, Search, Filter, Calendar, Building2, FileText, ExternalLink } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function BancoJurisprudencias() {
  const [searchTerm, setSearchTerm] = useState("");
  const [tribunalFilter, setTribunalFilter] = useState("todos");
  const [areaFilter, setAreaFilter] = useState("todas");

  // Dados de exemplo - em produção viriam do banco de dados
  const jurisprudencias = [
    {
      id: "1",
      numeroProcesso: "1234567-89.2024.8.26.0100",
      tribunal: "TJSP",
      area: "Direito Civil",
      ementa: "Ação de cobrança. Contrato de prestação de serviços. Inadimplemento. Procedência do pedido.",
      dataJulgamento: "2024-11-15",
      relator: "Des. João Silva",
      resultado: "Favorável"
    },
    {
      id: "2",
      numeroProcesso: "9876543-21.2024.5.02.0001",
      tribunal: "TRT-2",
      area: "Direito Trabalhista",
      ementa: "Reclamação trabalhista. Horas extras. Reconhecimento do direito. Procedência parcial.",
      dataJulgamento: "2024-11-10",
      relator: "Des. Maria Santos",
      resultado: "Parcial"
    },
    {
      id: "3",
      numeroProcesso: "5555555-55.2024.4.03.6100",
      tribunal: "TRF-3",
      area: "Direito Tributário",
      ementa: "Mandado de segurança. ICMS. Ilegitimidade da cobrança. Segurança concedida.",
      dataJulgamento: "2024-11-05",
      relator: "Des. Carlos Oliveira",
      resultado: "Favorável"
    }
  ];

  const filteredJurisprudencias = jurisprudencias.filter(j => {
    const matchesSearch = searchTerm === "" || 
      j.ementa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.numeroProcesso.includes(searchTerm);
    
    const matchesTribunal = tribunalFilter === "todos" || j.tribunal === tribunalFilter;
    const matchesArea = areaFilter === "todas" || j.area === areaFilter;

    return matchesSearch && matchesTribunal && matchesArea;
  });

  return (
    <div className="min-h-screen bg-background">
      <ModernHeader />
      
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Cabeçalho */}
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

        {/* Filtros */}
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
                    <SelectItem value="STJ">STJ</SelectItem>
                    <SelectItem value="STF">STF</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Área do Direito</label>
                <Select value={areaFilter} onValueChange={setAreaFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a área" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas as Áreas</SelectItem>
                    <SelectItem value="Direito Civil">Direito Civil</SelectItem>
                    <SelectItem value="Direito Trabalhista">Direito Trabalhista</SelectItem>
                    <SelectItem value="Direito Tributário">Direito Tributário</SelectItem>
                    <SelectItem value="Direito Previdenciário">Direito Previdenciário</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <FileText className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <div className="text-2xl font-bold">{jurisprudencias.length}</div>
                <div className="text-sm text-muted-foreground">Total de Jurisprudências</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Building2 className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <div className="text-2xl font-bold">5</div>
                <div className="text-sm text-muted-foreground">Tribunais</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Scale className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                <div className="text-2xl font-bold">4</div>
                <div className="text-sm text-muted-foreground">Áreas do Direito</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Calendar className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                <div className="text-2xl font-bold">{filteredJurisprudencias.length}</div>
                <div className="text-sm text-muted-foreground">Resultados Filtrados</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Jurisprudências */}
        <div className="space-y-4">
          {filteredJurisprudencias.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Nenhuma jurisprudência encontrada com os filtros aplicados.</p>
              </CardContent>
            </Card>
          ) : (
            filteredJurisprudencias.map((jurisprudencia) => (
              <Card key={jurisprudencia.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="font-mono">
                          {jurisprudencia.numeroProcesso}
                        </Badge>
                        <Badge className="bg-purple-500/10 text-purple-700 hover:bg-purple-500/20">
                          {jurisprudencia.tribunal}
                        </Badge>
                        <Badge variant="secondary">
                          {jurisprudencia.area}
                        </Badge>
                        <Badge 
                          className={
                            jurisprudencia.resultado === "Favorável" 
                              ? "bg-green-500/10 text-green-700 hover:bg-green-500/20"
                              : jurisprudencia.resultado === "Parcial"
                              ? "bg-yellow-500/10 text-yellow-700 hover:bg-yellow-500/20"
                              : "bg-red-500/10 text-red-700 hover:bg-red-500/20"
                          }
                        >
                          {jurisprudencia.resultado}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg">{jurisprudencia.ementa}</CardTitle>
                      <CardDescription className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(jurisprudencia.dataJulgamento).toLocaleDateString('pt-BR')}
                        </span>
                        <span>Relator: {jurisprudencia.relator}</span>
                      </CardDescription>
                    </div>
                    <Button variant="ghost" size="icon">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
