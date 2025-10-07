import { useState } from "react";
import React from "react";
import ModernSidebar from "@/components/Layout/ModernSidebar";
import ModernHeader from "@/components/Layout/ModernHeader";
import ModernNavigationCard from "@/components/Layout/ModernNavigationCard";
import DecisaoJudicialForm from "../components/Forms/DecisaoJudicialForm";
import PendenciasForm from "../components/Forms/PendenciasForm";
import SugestoesErrosForm from "../components/Forms/SugestoesErrosForm";
import AssistenciaTecnicaForm from "../components/Forms/AssistenciaTecnicaForm";
import BalcaoControladoriaForm from "../components/Forms/BalcaoControladoriaForm";
import CalculoPrazosForm from "../components/Forms/CalculoPrazosForm";
import DashboardControladoria from "./DashboardControladoria";
import CustomizableDashboard from "@/components/Dashboard/CustomizableDashboard";
import { useAuth } from "@/components/Auth/AuthProvider";
import ProtectedRoute from "@/components/Auth/ProtectedRoute";
import UserManagement from "@/components/Admin/UserManagement";
import { BulkUserCreator } from "@/components/Admin/BulkUserCreator";
import { Building, BarChart3, Scale, AlertTriangle, Lightbulb, Settings, Calculator, LayoutDashboard } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import DatabaseSetupNotice from "@/components/DatabaseSetupNotice";
type ActiveSection = 'home' | 'custom-dashboard' | 'decisoes' | 'pendencias' | 'calculo-prazos' | 'sugestoes-erros' | 'assistencia' | 'balcao' | 'dashboard-controladoria' | 'admin-usuarios' | 'bulk-users';
const Index = () => {
  const [activeSection, setActiveSection] = useState<ActiveSection>('custom-dashboard');
  const {
    user
  } = useAuth();
  console.log('Index component rendering, user:', user);

  // Event listeners for dashboard actions
  React.useEffect(() => {
    const handleNavigate = (e: CustomEvent) => {
      setActiveSection(e.detail as ActiveSection);
    };
    window.addEventListener('navigate-to' as any, handleNavigate);
    return () => {
      window.removeEventListener('navigate-to' as any, handleNavigate);
    };
  }, []);
  const navigationItems = [{
    id: 'custom-dashboard' as ActiveSection,
    title: "Meu Dashboard",
    description: "Dashboard personalizável com widgets",
    icon: LayoutDashboard,
    color: "teal" as const,
    stats: {
      count: 0,
      label: "Widgets"
    }
  }, {
    id: 'balcao' as ActiveSection,
    title: "Balcão da Controladoria",
    description: "Central de solicitações e atendimento",
    icon: Building,
    color: "primary" as const,
    stats: {
      count: 0,
      label: "Pendentes"
    }
  }, {
    id: 'dashboard-controladoria' as ActiveSection,
    title: "Dashboard Controladoria",
    description: "Visualização e métricas das solicitações",
    icon: BarChart3,
    color: "accent" as const,
    stats: {
      count: 0,
      label: "Relatórios"
    }
  }, {
    id: 'decisoes' as ActiveSection,
    title: "Decisão Judicial",
    description: "Registro e acompanhamento de decisões",
    icon: Scale,
    color: "purple" as const,
    stats: {
      count: 0,
      label: "Decisões"
    }
  }, {
    id: 'pendencias' as ActiveSection,
    title: "Pendências / Urgências",
    description: "Gestão de tarefas prioritárias",
    icon: AlertTriangle,
    color: "warning" as const,
    stats: {
      count: 0,
      label: "Urgentes"
    }
  }, {
    id: 'calculo-prazos' as ActiveSection,
    title: "Cálculo de Prazos",
    description: "Ferramenta de cálculo processual",
    icon: Calculator,
    color: "rose" as const,
    stats: {
      count: 0,
      label: "Cálculos"
    }
  }, {
    id: 'sugestoes-erros' as ActiveSection,
    title: "Sugestões e Erros",
    description: "Melhoria contínua e registro de problemas",
    icon: Lightbulb,
    color: "success" as const,
    stats: {
      count: 0,
      label: "Registros"
    }
  }, {
    id: 'assistencia' as ActiveSection,
    title: "Assistência Técnica",
    description: "Suporte técnico especializado",
    icon: Settings,
    color: "accent" as const,
    stats: {
      count: 0,
      label: "Tickets"
    }
  }];
  const renderContent = () => {
    switch (activeSection) {
      case 'home':
        return <div className="space-y-6">
            {/* Welcome Header */}
            <div className="text-center space-y-3">
              <h1 className="text-3xl font-bold text-primary">Sistema CRA</h1>
              <p className="text-lg text-muted-foreground">
                Plataforma Integrada de Comunicação Jurídica
              </p>
              <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
                Bem-vindo ao sistema profissional da Calazans Rossi Advogados. 
                Acesse as ferramentas e serviços através do menu lateral ou dos cards abaixo.
              </p>
            </div>

            {/* Compact Navigation List */}
            <div className="max-w-2xl mx-auto">
              <div className="bg-card rounded-lg border shadow-sm divide-y">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveSection(item.id)}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-accent/50 transition-colors text-left first:rounded-t-lg last:rounded-b-lg"
                    >
                      <Icon className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="text-sm font-medium flex-1">{item.title}</span>
                      <span className="text-xs text-muted-foreground">{item.stats.count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Compact Stats */}
            <div className="max-w-2xl mx-auto grid grid-cols-4 gap-2 mt-4">
              {[{
              label: "Processos",
              value: "0"
            }, {
              label: "Documentos",
              value: "0"
            }, {
              label: "Online",
              value: "1"
            }, {
              label: "Tarefas",
              value: "0"
            }].map((stat, index) => (
              <Card key={index} className="bg-card/50">
                <CardContent className="p-2 text-center">
                  <div className="text-lg font-bold">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
            </div>

            {/* Database Setup Notice */}
            <DatabaseSetupNotice />
          </div>;
      case 'custom-dashboard':
        return <CustomizableDashboard />;
      case 'decisoes':
        return <DecisaoJudicialForm />;
      case 'pendencias':
        return <PendenciasForm />;
      case 'calculo-prazos':
        return <CalculoPrazosForm />;
      case 'sugestoes-erros':
        return <SugestoesErrosForm />;
      case 'admin-usuarios':
        return <UserManagement />;
      case 'bulk-users':
        return <div className="space-y-6">
            <Button variant="ghost" onClick={() => setActiveSection('home')} className="mb-4">
              ← Voltar
            </Button>
            <BulkUserCreator />
          </div>;
      case 'balcao':
        return <BalcaoControladoriaForm />;
      case 'dashboard-controladoria':
        return <DashboardControladoria onBack={() => setActiveSection('home')} />;
      case 'assistencia':
        return <AssistenciaTecnicaForm />;
      default:
        return <div className="p-6">
            <h2 className="text-2xl font-semibold text-foreground">Seção não encontrada</h2>
            <p className="text-muted-foreground">A seção solicitada não foi implementada ainda.</p>
          </div>;
    }
  };
  return <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <ModernSidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      
      <div className="lg:ml-64">
        <ModernHeader />
        
        <main className="container mx-auto px-4 py-6">
          {renderContent()}
        </main>
      </div>
    </div>;
};
export default Index;