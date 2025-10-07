import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "@/components/Auth/AuthProvider";
import { 
  Users,
  Building, 
  BarChart3, 
  Scale, 
  ClipboardList, 
  Lightbulb, 
  AlertTriangle, 
  Settings, 
  Database,
  Menu,
  X,
  Home,
  ChevronRight,
  Calculator,
  Calendar,
  GraduationCap,
  LayoutDashboard
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type ActiveSection = 'home' | 'custom-dashboard' | 'decisoes' | 'pendencias' | 'calculo-prazos' | 'sugestoes-erros' | 'assistencia' | 'balcao' | 'dashboard-controladoria' | 'admin-usuarios' | 'bulk-users';

interface ModernSidebarProps {
  activeSection: ActiveSection;
  onSectionChange: (section: ActiveSection) => void;
}

const ModernSidebar = ({ activeSection, onSectionChange }: ModernSidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user } = useAuth();

  const navigationItems = [
    {
      id: 'home' as ActiveSection,
      title: "Início",
      icon: Home,
      color: "text-primary"
    },
    {
      id: 'custom-dashboard' as ActiveSection,
      title: "Meu Dashboard",
      icon: LayoutDashboard,
      color: "text-accent"
    },
    {
      id: 'balcao' as ActiveSection,
      title: "Balcão da Controladoria",
      icon: Building,
      color: "text-primary"
    },
    {
      id: 'dashboard-controladoria' as ActiveSection,
      title: "Dashboard Controladoria",
      icon: BarChart3,
      color: "text-accent-foreground"
    },
    {
      id: 'decisoes' as ActiveSection,
      title: "Decisão Judicial",
      icon: Scale,
      color: "text-purple"
    },
    {
      id: 'pendencias' as ActiveSection,
      title: "Pendências / Urgências",
      icon: ClipboardList,
      color: "text-warning"
    },
    {
      id: 'calculo-prazos' as ActiveSection,
      title: "Cálculo de Prazos",
      icon: Calculator,
      color: "text-info"
    },
    {
      id: 'sugestoes-erros' as ActiveSection,
      title: "Sugestões e Erros",
      icon: Lightbulb,
      color: "text-success"
    },
    {
      id: 'assistencia' as ActiveSection,
      title: "Assistência Técnica",
      icon: Settings,
      color: "text-accent-foreground"
    },
    {
      id: 'admin-usuarios' as ActiveSection,
      title: "Gerenciar Usuários e Clientes",
      icon: Users,
      color: "text-violet-500"
    }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {!isCollapsed && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsCollapsed(true)}
        />
      )}
      
      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed top-0 left-0 h-full bg-gradient-to-b from-card via-card/95 to-card/90 border-r border-border/50 shadow-elevated z-50 transition-all duration-300 ease-in-out",
          isCollapsed ? "w-16" : "w-72",
          "lg:relative lg:translate-x-0",
          !isCollapsed ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Header da Sidebar */}
        <div className={cn(
          "flex items-center justify-between p-4 border-b border-border/50",
          isCollapsed && "justify-center"
        )}>
          {!isCollapsed && (
            <div className="flex items-center space-x-3">
              <div className="h-8 flex items-center">
                <img 
                  src="/calazans-rossi-logo.png" 
                  alt="Calazans Rossi Advogados" 
                  className="h-6 w-auto"
                  onError={(e) => {
                    console.error('Erro ao carregar logo no sidebar');
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
              <div>
                <h1 className="font-display font-semibold text-sm text-foreground">Sistema CRA</h1>
                <p className="text-xs text-muted-foreground">Comunicação Jurídica</p>
              </div>
            </div>
          )}
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-8 w-8 hover:bg-accent/50"
          >
            {isCollapsed ? <Menu className="w-4 h-4" /> : <X className="w-4 h-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navigationItems
            // .filter(item => {
            //   // Mostrar "Gerenciar Usuários" apenas para administradores
            //   if (item.id === 'admin-usuarios') {
            //     return user?.user_metadata?.role === 'admin';
            //   }
            //   return true;
            // })
            .map((item, index) => (
            <Button
              key={item.id}
              variant={activeSection === item.id ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start h-12 transition-all duration-200 group hover-lift",
                isCollapsed ? "px-3" : "px-4",
                activeSection === item.id && "bg-accent/20 shadow-glow border-l-4 border-primary"
              )}
              style={{ animationDelay: `${index * 50}ms` }}
              onClick={() => onSectionChange(item.id)}
            >
              <item.icon className={cn(
                "w-5 h-5 flex-shrink-0 transition-colors",
                activeSection === item.id ? "text-primary" : item.color,
                !isCollapsed && "mr-3"
              )} />
              
              {!isCollapsed && (
                <>
                  <span className="font-medium text-sm truncate flex-1 text-left">
                    {item.title}
                  </span>
                  {activeSection === item.id && (
                    <ChevronRight className="w-4 h-4 text-primary opacity-60" />
                  )}
                </>
              )}
            </Button>
          ))}
        </nav>

        {/* Footer da Sidebar */}
        {!isCollapsed && (
          <div className="p-4 border-t border-border/50 bg-gradient-to-r from-accent/10 to-transparent">
            <div className="text-center">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Sistema Profissional de<br />
                Comunicação Jurídica
              </p>
              <div className="mt-2 text-xs font-medium text-primary">
                v2.0 Premium
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Mobile Toggle Button */}
      <Button
        variant="outline"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden shadow-elevated bg-card/90 backdrop-blur-sm"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <Menu className="w-4 h-4" />
      </Button>
    </>
  );
};

export default ModernSidebar;