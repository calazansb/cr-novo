import { useState } from "react";
import ModernSidebar from "@/components/Layout/ModernSidebar";
import ModernHeader from "@/components/Layout/ModernHeader";
import ModernNavigationCard from "@/components/Layout/ModernNavigationCard";
import DecisaoJudicialForm from "../components/Forms/DecisaoJudicialForm";
import PendenciasForm from "../components/Forms/PendenciasForm";
import SuestoesForm from "../components/Forms/SuestoesForm";
import ErrosForm from "../components/Forms/ErrosForm";
import AssistenciaTecnicaForm from "../components/Forms/AssistenciaTecnicaForm";
import BalcaoControladoriaForm from "../components/Forms/BalcaoControladoriaForm";
import CalculoPrazosForm from "../components/Forms/CalculoPrazosForm";
import AudienciasForm from "../components/Forms/AudienciasForm";
import DashboardControladoria from "./DashboardControladoria";
import CustomizableDashboard from "@/components/Dashboard/CustomizableDashboard";
import BancoDados from "../components/BancoDados";
import { useAuth } from "@/components/Auth/AuthProvider";
import ProtectedRoute from "@/components/Auth/ProtectedRoute";
// import TreinamentosPage from "@/components/Treinamentos/TreinamentosPage";
import UserManagement from "@/components/Admin/UserManagement";
import { BulkUserCreator } from "@/components/Admin/BulkUserCreator";
import { Building, BarChart3, Scale, ClipboardList, Lightbulb, AlertTriangle, Settings, Database, Calculator, Calendar, GraduationCap, LayoutDashboard } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import DatabaseSetupNotice from "@/components/DatabaseSetupNotice";

type ActiveSection = 'home' | 'custom-dashboard' | 'decisoes' | 'pendencias' | 'calculo-prazos' | 'audiencias' | 'sugestoes' | 'erros' | 'assistencia' | 'balcao' | 'dashboard-controladoria' | 'banco-dados' | 'admin-usuarios' | 'bulk-users';

const Index = () => {
  const [activeSection, setActiveSection] = useState<ActiveSection>('home');
  const { user } = useAuth();

  console.log('Index component rendering, user:', user);

  const navigationItems = [
    {
      id: 'custom-dashboard' as ActiveSection,
      title: "Meu Dashboard",
      description: "Dashboard personalizável com widgets",
      icon: LayoutDashboard,
      color: "accent" as const,
      stats: { count: 0, label: "Widgets" }
    },
    {
      id: 'balcao' as ActiveSection,
      title: "Balcão da Controladoria",
      description: "Central de solicitações e atendimento",
      icon: Building,
      color: "primary" as const,
      stats: { count: 0, label: "Pendentes" }
    },
    {
      id: 'dashboard-controladoria' as ActiveSection,
      title: "Dashboard Controladoria", 
      description: "Visualização e métricas das solicitações",
      icon: BarChart3,
      color: "accent" as const,
      stats: { count: 0, label: "Relatórios" }
    },
    {
      id: 'banco-dados' as ActiveSection,
      title: "Banco de Dados",
      description: "Repositório central de informações",
      icon: Database,
      color: "secondary" as const,
      stats: { count: 0, label: "Documentos" }
    },
    {
      id: 'decisoes' as ActiveSection,
      title: "Decisão Judicial",
      description: "Registro e acompanhamento de decisões",
      icon: Scale,
      color: "purple" as const,
      stats: { count: 0, label: "Decisões" }
    },
    {
      id: 'pendencias' as ActiveSection,
      title: "Pendências / Urgências",
      description: "Gestão de tarefas prioritárias",
      icon: ClipboardList,
      color: "warning" as const,
      stats: { count: 0, label: "Urgentes" }
    },
    {
      id: 'calculo-prazos' as ActiveSection,
      title: "Cálculo de Prazos",
      description: "Ferramenta de cálculo processual",
      icon: Calculator,
      color: "accent" as const,
      stats: { count: 0, label: "Cálculos" }
    },
    {
      id: 'audiencias' as ActiveSection,
      title: "Agenda de Audiências",
      description: "Controle de agenda processual",
      icon: Calendar,
      color: "secondary" as const,
      stats: { count: 0, label: "Agendadas" }
    },
    // {
    //   id: 'treinamentos' as ActiveSection,
    //   title: "Treinamentos",
    //   description: "Materiais e cursos obrigatórios",
    //   icon: GraduationCap,
    //   color: "accent" as const,
    //   stats: { count: 0, label: "Disponíveis" }
    // },
    {
      id: 'sugestoes' as ActiveSection,
      title: "Sugestões",
      description: "Canal de melhoria contínua",
      icon: Lightbulb,
      color: "success" as const,
      stats: { count: 0, label: "Ideias" }
    },
    {
      id: 'erros' as ActiveSection,
      title: "Erros",
      description: "Registro de problemas do sistema",
      icon: AlertTriangle,
      color: "destructive" as const,
      stats: { count: 0, label: "Abertos" }
    },
    {
      id: 'assistencia' as ActiveSection,
      title: "Assistência Técnica",
      description: "Suporte técnico especializado",
      icon: Settings,
      color: "accent" as const,
      stats: { count: 0, label: "Tickets" }
    }
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'home':
        return (
          <div className="space-y-8">
            {/* Welcome Header */}
            <div className="text-center space-y-4">
              <h1 className="text-4xl font-bold text-primary">Sistema CRA</h1>
              <p className="text-xl text-muted-foreground">
                Plataforma Integrada de Comunicação Jurídica
              </p>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Bem-vindo ao sistema profissional da Calazans Rossi Advogados. 
                Acesse as ferramentas e serviços através do menu lateral ou dos cards abaixo.
              </p>
            </div>

            {/* Navigation Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {navigationItems.map((item, index) => (
                <ModernNavigationCard
                  key={item.id}
                  title={item.title}
                  description={item.description}
                  icon={item.icon}
                  color={item.color}
                  stats={item.stats}
                  onClick={() => setActiveSection(item.id)}
                />
              ))}
            </div>

            {/* Quick Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
              {[
                { 
                  label: "Processos Ativos", 
                  value: "0", 
                  trend: "+12%",
                  loading: false 
                },
                { 
                  label: "Documentos", 
                  value: "0", 
                  trend: "+8%",
                  loading: false 
                },
                { 
                  label: "Usuários Online", 
                  value: "1", 
                  trend: "+15%",
                  loading: false 
                },
                { 
                  label: "Tarefas Hoje", 
                  value: "0", 
                  trend: "+3%",
                  loading: false 
                }
              ].map((stat, index) => (
                <div key={index} className="bg-card/50 backdrop-blur-sm rounded-xl p-4 border border-border/50">
                  <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                  <div className="text-xs text-success mt-1">{stat.trend}</div>
                </div>
              ))}
            </div>

            {/* System Status */}
            <div className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-xl p-6 border border-primary/20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Status do Sistema</h3>
              </div>
              
              <div className="flex items-center space-x-2 text-success">
                <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Sistema Operacional</span>
              </div>
              <div className="text-xs text-muted-foreground">
                Última atualização: {new Date().toLocaleTimeString('pt-BR')}
              </div>
            </div>

            {/* Database Setup Notice */}
            <DatabaseSetupNotice />

            {/* Admin Quick Actions */}
            <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 border border-border/50">
              <h3 className="text-lg font-semibold text-foreground mb-4">Ações Administrativas</h3>
              <div className="flex gap-4">
                <Button 
                  variant="outline"
                  onClick={() => setActiveSection('bulk-users')}
                  className="flex items-center gap-2"
                >
                  Criar Usuários em Massa
                </Button>
              </div>
            </div>
          </div>
        );
        
      case 'custom-dashboard':
        return <CustomizableDashboard />;
        
      case 'decisoes':
        return <DecisaoJudicialForm />;
      case 'pendencias':
        return <PendenciasForm />;
      case 'calculo-prazos':
        return <CalculoPrazosForm />;
      case 'audiencias':
        return <AudienciasForm />;
      case 'admin-usuarios':
        return <UserManagement />;
      case 'bulk-users':
        return (
          <div className="space-y-6">
            <Button 
              variant="ghost" 
              onClick={() => setActiveSection('home')}
              className="mb-4"
            >
              ← Voltar
            </Button>
            <BulkUserCreator />
          </div>
        );
      case 'sugestoes':
        return <SuestoesForm />;
      case 'erros':
        return <ErrosForm />;
      case 'balcao':
        return <BalcaoControladoriaForm />;
      case 'dashboard-controladoria':
        return <DashboardControladoria onBack={() => setActiveSection('home')} />;
      case 'banco-dados':
        return <BancoDados />;
      case 'assistencia':
        return <AssistenciaTecnicaForm />;
      default:
        return (
          <div className="p-6">
            <h2 className="text-2xl font-semibold text-foreground">Seção não encontrada</h2>
            <p className="text-muted-foreground">A seção solicitada não foi implementada ainda.</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <div className="flex">
        <ModernSidebar 
          activeSection={activeSection} 
          onSectionChange={setActiveSection}
        />
        
        <main className="flex-1 lg:ml-0">
          <ModernHeader />
          
          <div className="container mx-auto px-4 py-6">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;