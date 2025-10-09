import { useState } from "react";
import React from "react";
import ModernSidebar from "@/components/Layout/ModernSidebar";
import ModernHeader from "@/components/Layout/ModernHeader";
import { WelcomeQuote } from "@/components/Motivational/WelcomeQuote";
import DecisaoJudicialForm from "../components/Forms/DecisaoJudicialForm";
import PendenciasForm from "../components/Forms/PendenciasForm";
import SugestoesErrosForm from "../components/Forms/SugestoesErrosForm";
import AssistenciaTecnicaForm from "../components/Forms/AssistenciaTecnicaForm";
import BalcaoControladoriaForm from "../components/Forms/BalcaoControladoriaForm";
import CalculoPrazosForm from "../components/Forms/CalculoPrazosForm";
import DashboardControladoria from "./DashboardControladoria";
import CustomizableDashboard from "@/components/Dashboard/CustomizableDashboard";
import { useAuth } from "@/components/Auth/AuthProvider";
import UserManagement from "@/components/Admin/UserManagement";
import { BulkUserCreator } from "@/components/Admin/BulkUserCreator";
import { Button } from "@/components/ui/button";
import HapvidaModule from "@/components/Modules/HapvidaModule";
type ActiveSection = 'custom-dashboard' | 'decisoes' | 'pendencias' | 'calculo-prazos' | 'sugestoes-erros' | 'assistencia' | 'balcao' | 'dashboard-controladoria' | 'admin-usuarios' | 'bulk-users' | 'hapvida';
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
      case 'hapvida':
        return <HapvidaModule />;
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