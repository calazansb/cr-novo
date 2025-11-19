import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Users, MapPin, Scale, Gavel, Cloud } from "lucide-react";
import UserManagement from "@/components/Admin/UserManagement";
import { OptionAdminModal } from "@/components/Admin/OptionAdminModal";

import { Button } from "@/components/ui/button";

export default function AdminPage() {
  const [comarcasModalOpen, setComarcasModalOpen] = useState(false);
  const [varasModalOpen, setVarasModalOpen] = useState(false);
  const [magistradosModalOpen, setMagistradosModalOpen] = useState(false);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-primary/10 rounded-lg">
          <Settings className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Administração</h1>
          <p className="text-muted-foreground">Gerencie usuários, clientes e comarcas do sistema</p>
        </div>
      </div>

      <Tabs defaultValue="comarcas" className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto">
          <TabsTrigger value="comarcas" className="gap-2">
            <MapPin className="h-4 w-4" />
            Comarcas
          </TabsTrigger>
          <TabsTrigger value="varas" className="gap-2">
            <Scale className="h-4 w-4" />
            Varas/Câmaras
          </TabsTrigger>
          <TabsTrigger value="magistrados" className="gap-2">
            <Gavel className="h-4 w-4" />
            Magistrados
          </TabsTrigger>
          <TabsTrigger value="usuarios-clientes" className="gap-2">
            <Users className="h-4 w-4" />
            Usuários
          </TabsTrigger>
        </TabsList>

        <TabsContent value="comarcas" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciar Comarcas</CardTitle>
              <CardDescription>
                Adicione, edite ou remova comarcas de Minas Gerais utilizadas nos processos judiciais
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setComarcasModalOpen(true)} className="w-full sm:w-auto">
                <MapPin className="h-4 w-4 mr-2" />
                Abrir Gerenciador de Comarcas
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="varas" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciar Varas / Câmaras / Turmas</CardTitle>
              <CardDescription>
                Adicione, edite ou remova varas, câmaras e turmas utilizadas nos processos judiciais
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setVarasModalOpen(true)} className="w-full sm:w-auto">
                <Scale className="h-4 w-4 mr-2" />
                Abrir Gerenciador de Varas/Câmaras/Turmas
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="magistrados" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciar Magistrados</CardTitle>
              <CardDescription>
                Adicione, edite ou remova magistrados (desembargadores e juízes) utilizados nas decisões judiciais
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setMagistradosModalOpen(true)} className="w-full sm:w-auto">
                <Gavel className="h-4 w-4 mr-2" />
                Abrir Gerenciador de Magistrados
              </Button>
            </CardContent>
          </Card>
        </TabsContent>


        <TabsContent value="usuarios-clientes" className="mt-6">
          <UserManagement />
        </TabsContent>
      </Tabs>

      <OptionAdminModal
        open={comarcasModalOpen}
        onOpenChange={setComarcasModalOpen}
        optionSetKey="comarcas"
      />

      <OptionAdminModal
        open={varasModalOpen}
        onOpenChange={setVarasModalOpen}
        optionSetKey="varas_camaras_turmas"
      />

      <OptionAdminModal
        open={magistradosModalOpen}
        onOpenChange={setMagistradosModalOpen}
        optionSetKey="magistrados"
      />
    </div>
  );
}
