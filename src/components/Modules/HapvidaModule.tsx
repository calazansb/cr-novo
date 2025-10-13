import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, AlertTriangle, FileText, BarChart, Ban } from "lucide-react";
import PendenciasForm from "@/components/Forms/PendenciasForm";
import BloqueiosForm from "@/components/Forms/BloqueiosForm";
import { Badge } from "@/components/ui/badge";

interface HapvidaModuleProps {
  onBack?: () => void;
}

const HapvidaModule = ({ onBack }: HapvidaModuleProps) => {
  const [activeTab, setActiveTab] = useState("pendencias");

  return (
    <div className="animate-fade-in space-y-6">
      <Card className="shadow-elevated bg-gradient-card border-2 border-emerald-500/20">
        <CardHeader className="text-center pb-4">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 rounded-xl">
              <Building2 className="h-10 w-10 text-emerald-500" />
            </div>
            <div>
              <CardTitle className="text-4xl text-gradient">Hapvida</CardTitle>
              <Badge variant="outline" className="mt-1 bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                Cliente Premium
              </Badge>
            </div>
          </div>
          <CardDescription className="text-base">
            Gestão completa de solicitações e pendências do cliente Hapvida
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="pendencias" className="gap-2">
                <AlertTriangle className="h-4 w-4" />
                Pendências
              </TabsTrigger>
              <TabsTrigger value="bloqueios" className="gap-2">
                <Ban className="h-4 w-4" />
                Bloqueios
              </TabsTrigger>
              <TabsTrigger value="solicitacoes" className="gap-2">
                <FileText className="h-4 w-4" />
                Solicitações
              </TabsTrigger>
              <TabsTrigger value="relatorios" className="gap-2">
                <BarChart className="h-4 w-4" />
                Relatórios
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pendencias" className="mt-0">
              <div className="bg-muted/30 rounded-lg p-1">
                <PendenciasForm clienteFilter="Hapvida Assistência Médica LTDA" />
              </div>
            </TabsContent>

            <TabsContent value="bloqueios" className="mt-0">
              <div className="bg-muted/30 rounded-lg p-1">
                <BloqueiosForm clienteFilter="Hapvida Assistência Médica LTDA" />
              </div>
            </TabsContent>

            <TabsContent value="solicitacoes" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Solicitações Hapvida</CardTitle>
                  <CardDescription>
                    Visualize e gerencie todas as solicitações específicas do cliente Hapvida
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">Em desenvolvimento</p>
                    <p className="text-sm mt-2">
                      Esta seção exibirá o histórico completo de solicitações do cliente Hapvida
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="relatorios" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Relatórios Hapvida</CardTitle>
                  <CardDescription>
                    Análises e métricas das solicitações e atendimentos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-muted-foreground">
                    <BarChart className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">Em desenvolvimento</p>
                    <p className="text-sm mt-2">
                      Estatísticas e indicadores de performance para o cliente Hapvida
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default HapvidaModule;
