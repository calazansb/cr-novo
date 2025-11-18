import { useState } from "react";
import React from "react";
import ModernSidebar from "@/components/Layout/ModernSidebar";
import ModernHeader from "@/components/Layout/ModernHeader";
import { WelcomeQuote } from "@/components/Motivational/WelcomeQuote";
import DecisaoJudicialFormNova from "../components/Forms/DecisaoJudicialFormNova";
import PendenciasForm from "../components/Forms/PendenciasForm";
import SugestoesErrosForm from "../components/Forms/SugestoesErrosForm";
import AssistenciaTecnicaForm from "../components/Forms/AssistenciaTecnicaForm";
import BalcaoControladoriaForm from "../components/Forms/BalcaoControladoriaForm";
import CalculoPrazosForm from "../components/Forms/CalculoPrazosForm";
import DashboardControladoria from "./DashboardControladoria";
import DashboardDecisoes from "./DashboardDecisoes";
import DashboardHapvida from "./DashboardHapvida";
import DashboardExecutivo from "./DashboardExecutivo";
import DashboardAuditoria from "./DashboardAuditoria";
import DashboardSugestoesErros from "./DashboardSugestoesErros";
import DashboardAssistenciaTecnica from "./DashboardAssistenciaTecnica";
import CustomizableDashboard from "@/components/Dashboard/CustomizableDashboard";
import { useAuth } from "@/components/Auth/AuthProvider";
import AdminPage from "./AdminPage";
import { BulkUserCreator } from "@/components/Admin/BulkUserCreator";
import { Button } from "@/components/ui/button";
import HapvidaModule from "@/components/Modules/HapvidaModule";
import Jurimetria from "./Jurimetria";
import Analytics from "./Analytics";
type ActiveSection = 'custom-dashboard' | 'decisoes' | 'dashboard-decisoes' | 'dashboard-executivo' | 'dashboard-auditoria' | 'jurimetria' | 'analytics' | 'pendencias' | 'calculo-prazos' | 'sugestoes-erros' | 'dashboard-sugestoes-erros' | 'assistencia' | 'dashboard-assistencia' | 'balcao' | 'dashboard-controladoria' | 'dashboard-hapvida' | 'admin-usuarios' | 'bulk-users' | 'hapvida' | 'hapvida-pendencias' | 'hapvida-solicitacoes' | 'hapvida-relatorios';
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
  const renderContent = () => {
    switch (activeSection) {
      case 'custom-dashboard':
        return <CustomizableDashboard />;
      case 'dashboard-hapvida':
        return <DashboardHapvida onBack={() => setActiveSection('custom-dashboard')} />;
      case 'hapvida':
      case 'hapvida-pendencias':
        return <HapvidaModule />;
      case 'hapvida-solicitacoes':
        return <div className="p-6">
            <h2 className="text-2xl font-semibold text-foreground">Solicitações Hapvida</h2>
            <p className="text-muted-foreground">Em desenvolvimento</p>
          </div>;
      case 'hapvida-relatorios':
        return <div className="p-6">
            <h2 className="text-2xl font-semibold text-foreground">Relatórios Hapvida</h2>
            <p className="text-muted-foreground">Em desenvolvimento</p>
          </div>;
      case 'decisoes':
        return <DecisaoJudicialFormNova />;
      case 'dashboard-executivo':
        return <DashboardExecutivo />;
      case 'dashboard-auditoria':
        return <DashboardAuditoria />;
      case 'dashboard-decisoes':
        return <DashboardDecisoes onBack={() => setActiveSection('decisoes')} />;
      case 'jurimetria':
        return <Jurimetria onBack={() => setActiveSection('custom-dashboard')} />;
      case 'analytics':
        return <Analytics onBack={() => setActiveSection('custom-dashboard')} />;
      case 'pendencias':
        return <PendenciasForm />;
      case 'calculo-prazos':
        return <CalculoPrazosForm />;
      case 'sugestoes-erros':
        return <SugestoesErrosForm />;
      case 'dashboard-sugestoes-erros':
        return <DashboardSugestoesErros />;
      case 'dashboard-assistencia':
        return <DashboardAssistenciaTecnica />;
      case 'admin-usuarios':
        return <AdminPage />;
      case 'bulk-users':
        return <div className="space-y-6">
            <Button variant="ghost" onClick={() => setActiveSection('custom-dashboard')} className="mb-4">
              ← Voltar
            </Button>
            <BulkUserCreator />
          </div>;
      case 'balcao':
        return <BalcaoControladoriaForm />;
      case 'dashboard-controladoria':
        return <DashboardControladoria onBack={() => setActiveSection('custom-dashboard')} />;
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
      {/* Animação de Boas-Vindas */}
      <WelcomeQuote />
      
      <ModernSidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      
      <div className="lg:ml-72">
        <ModernHeader />
        
        <main className="container mx-auto px-4 py-6">
          {renderContent()}
        </main>
      </div>
    </div>;
};
export default Index;