import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "@/components/Auth/AuthProvider";
import { Users, Building, BarChart3, Scale, Lightbulb, AlertTriangle, Settings, Database, Menu, X, ChevronRight, Calculator, Calendar, GraduationCap, LayoutDashboard, Building2, ChevronDown } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
type ActiveSection = 'custom-dashboard' | 'decisoes' | 'dashboard-decisoes' | 'pendencias' | 'calculo-prazos' | 'sugestoes-erros' | 'assistencia' | 'balcao' | 'dashboard-controladoria' | 'admin-usuarios' | 'bulk-users' | 'hapvida' | 'hapvida-pendencias' | 'hapvida-solicitacoes' | 'hapvida-relatorios';
interface ModernSidebarProps {
  activeSection: ActiveSection;
  onSectionChange: (section: ActiveSection) => void;
}
const ModernSidebar = ({
  activeSection,
  onSectionChange
}: ModernSidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['hapvida']);
  const {
    user
  } = useAuth();

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };
  const navigationItems = [{
    id: 'custom-dashboard' as ActiveSection,
    title: "Meu Dashboard",
    icon: LayoutDashboard,
    color: "text-purple-500",
    bgHover: "hover:bg-purple-500/10"
  }, {
    id: 'balcao' as ActiveSection,
    title: "Balcão da Controladoria",
    icon: Building,
    color: "text-cyan-500",
    bgHover: "hover:bg-cyan-500/10"
  }, {
    id: 'dashboard-controladoria' as ActiveSection,
    title: "Dashboard Controladoria",
    icon: BarChart3,
    color: "text-orange-500",
    bgHover: "hover:bg-orange-500/10"
  }, {
    id: 'decisoes' as ActiveSection,
    title: "Registrar Decisão",
    icon: Scale,
    color: "text-indigo-500",
    bgHover: "hover:bg-indigo-500/10"
  }, {
    id: 'dashboard-decisoes' as ActiveSection,
    title: "Dashboard Decisões",
    icon: BarChart3,
    color: "text-purple-500",
    bgHover: "hover:bg-indigo-500/10"
  }, {
    id: 'calculo-prazos' as ActiveSection,
    title: "Cálculo de Prazos",
    icon: Calculator,
    color: "text-cyan-500",
    bgHover: "hover:bg-cyan-500/10"
  }, {
    id: 'sugestoes-erros' as ActiveSection,
    title: "Sugestões e Erros",
    icon: Lightbulb,
    color: "text-amber-500",
    bgHover: "hover:bg-amber-500/10"
  }, {
    id: 'assistencia' as ActiveSection,
    title: "Assistência Técnica",
    icon: Settings,
    color: "text-teal-500",
    bgHover: "hover:bg-teal-500/10"
  }, {
    id: 'admin-usuarios' as ActiveSection,
    title: "Administração",
    icon: Settings,
    color: "text-violet-500",
    bgHover: "hover:bg-violet-500/10"
  }];

  const hapvidaSubItems = [
    {
      id: 'hapvida-pendencias' as ActiveSection,
      title: "Pendências e Urgências",
      icon: AlertTriangle,
      color: "text-rose-400",
    },
    {
      id: 'hapvida-solicitacoes' as ActiveSection,
      title: "Solicitações",
      icon: Building,
      color: "text-blue-400",
    },
    {
      id: 'hapvida-relatorios' as ActiveSection,
      title: "Relatórios",
      icon: BarChart3,
      color: "text-amber-400",
    }
  ];
  return <>
      {/* Mobile Backdrop */}
      {!isCollapsed && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsCollapsed(true)} />}
      
      {/* Sidebar */}
      <aside className={cn("fixed top-0 left-0 h-screen bg-gradient-to-br from-slate-900 via-[#1e3a5f] to-slate-950 border-r border-slate-700/30 shadow-2xl z-50 transition-all duration-300 ease-in-out backdrop-blur-xl flex flex-col", isCollapsed ? "w-16" : "w-72", "lg:translate-x-0", !isCollapsed ? "translate-x-0" : "-translate-x-full lg:translate-x-0")}>
        {/* Header da Sidebar */}
        <div className={cn("flex items-center justify-between p-6 border-b border-slate-700/30 bg-slate-900/40 backdrop-blur-sm", isCollapsed && "justify-center p-4")}> 
          {!isCollapsed && <div className="flex items-center justify-center w-full px-2">
              <img 
                src="/marca-principal-branca.png" 
                alt="Calazans Rossi Advogados" 
                className="h-20 w-auto object-contain"
                onError={(e) => {
                  console.error('Erro ao carregar logo');
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>}
          
          {isCollapsed && <div className="flex items-center justify-center">
              <img 
                src="/marca-principal-branca.png" 
                alt="CR" 
                className="h-8 w-auto object-contain"
                onError={(e) => {
                  console.error('Erro ao carregar logo');
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>}
          
          <Button variant="ghost" size="icon" onClick={() => setIsCollapsed(!isCollapsed)} className={cn("h-8 w-8 hover:bg-blue-500/20 text-slate-300 hover:text-white transition-colors absolute top-4 right-4")}>
            {isCollapsed ? <Menu className="w-4 h-4" /> : <X className="w-4 h-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900">
          {navigationItems.map((item, index) => <Button key={item.id} variant="ghost" className={cn("w-full justify-start h-12 transition-all duration-200 group relative overflow-hidden rounded-xl", isCollapsed ? "px-3" : "px-4", activeSection === item.id ? "bg-blue-600/25 text-white border-l-4 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.3)]" : "text-slate-300 hover:bg-blue-500/15 hover:text-white", item.bgHover)} style={{
            animationDelay: `${index * 50}ms`
          }} onClick={() => onSectionChange(item.id)}>
              <item.icon className={cn("w-5 h-5 flex-shrink-0 transition-all duration-200", activeSection === item.id ? item.color : item.color, !isCollapsed && "mr-3", "drop-shadow-[0_0_8px_currentColor]")} />
              
              {!isCollapsed && <>
                  <span className="font-semibold text-sm truncate flex-1 text-left">
                    {item.title}
                  </span>
                  {activeSection === item.id && <ChevronRight className="w-4 h-4 opacity-80" />}
                </>}
            </Button>)}

          {/* Hapvida Dropdown Group */}
          <div className="space-y-1">
            <Button 
              variant="ghost" 
              className={cn(
                "w-full justify-start h-12 transition-all duration-200 group relative overflow-hidden rounded-xl",
                isCollapsed ? "px-3" : "px-4",
                activeSection.startsWith('hapvida') 
                  ? "bg-emerald-600/25 text-white border-l-4 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]" 
                  : "text-slate-300 hover:bg-emerald-500/15 hover:text-white hover:bg-emerald-500/10"
              )}
              onClick={() => toggleGroup('hapvida')}
            >
              <Building2 className={cn(
                "w-5 h-5 flex-shrink-0 transition-all duration-200 text-emerald-500",
                !isCollapsed && "mr-3",
                "drop-shadow-[0_0_8px_currentColor]"
              )} />
              
              {!isCollapsed && (
                <>
                  <span className="font-semibold text-sm truncate flex-1 text-left">
                    Hapvida
                  </span>
                  <ChevronDown className={cn(
                    "w-4 h-4 opacity-80 transition-transform duration-200",
                    expandedGroups.includes('hapvida') && "rotate-180"
                  )} />
                </>
              )}
            </Button>

            {/* Sub-items */}
            {!isCollapsed && expandedGroups.includes('hapvida') && (
              <div className="ml-4 space-y-1 border-l-2 border-emerald-500/30 pl-2">
                {hapvidaSubItems.map((subItem) => (
                  <Button
                    key={subItem.id}
                    variant="ghost"
                    className={cn(
                      "w-full justify-start h-10 transition-all duration-200 rounded-lg",
                      "px-3",
                      activeSection === subItem.id
                        ? "bg-emerald-500/20 text-white font-medium"
                        : "text-slate-400 hover:bg-emerald-500/10 hover:text-slate-200"
                    )}
                    onClick={() => onSectionChange(subItem.id)}
                  >
                    <subItem.icon className={cn("w-4 h-4 mr-2", subItem.color)} />
                    <span className="text-sm truncate">{subItem.title}</span>
                  </Button>
                ))}
              </div>
            )}
          </div>
        </nav>

        {/* Footer da Sidebar */}
        {!isCollapsed && <div className="p-4 border-t border-slate-700/30 bg-slate-900/40 backdrop-blur-sm">
            <div className="text-center">
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                Sistema Profissional de<br />
                Comunicação Jurídica
              </p>
              <div className="mt-2 px-3 py-1 bg-blue-500/15 border border-blue-500/30 rounded-full inline-block">
                <span className="text-xs font-semibold text-blue-400">v2.0 Premium</span>
              </div>
            </div>
          </div>}
      </aside>

      {/* Mobile Toggle Button */}
      <Button variant="outline" size="icon" className="fixed top-4 left-4 z-50 lg:hidden shadow-elevated bg-card/90 backdrop-blur-sm" onClick={() => setIsCollapsed(!isCollapsed)}>
        <Menu className="w-4 h-4" />
      </Button>
    </>;
};
export default ModernSidebar;