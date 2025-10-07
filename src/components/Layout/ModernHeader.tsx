import { useState, useEffect } from "react";
import { Moon, Sun, Search, User, Settings, LogOut } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/components/Auth/AuthProvider";
import { ChangePasswordForm } from "@/components/Auth/ChangePasswordForm";
import NotificationBell from "@/components/Notifications/NotificationBell";
import { cn } from "@/lib/utils";
interface ModernHeaderProps {
  className?: string;
}
const ModernHeader = ({
  className
}: ModernHeaderProps) => {
  const [isDark, setIsDark] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const {
    user,
    signOut
  } = useAuth();
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };
  return <header className={cn("sticky top-0 z-40 w-full border-b border-slate-200/20 dark:border-slate-700/30 bg-gradient-to-r from-white/80 via-slate-50/80 to-white/80 dark:from-slate-900/80 dark:via-slate-800/80 dark:to-slate-900/80 backdrop-blur-xl shadow-lg", className)}>
      <div className="container flex h-20 items-center justify-between px-6">
        {/* Logo - Aumentado 300% */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <img 
              src="/calazans-rossi-logo.png" 
              alt="Calazans Rossi Advogados" 
              className="h-16 w-auto"
              onError={e => {
                console.error('Erro ao carregar logo');
                e.currentTarget.style.display = 'none';
              }} 
            />
          </div>
          <div className="hidden lg:block border-l border-slate-300 dark:border-slate-600 pl-4 h-12 flex items-center">
            <h1 className="font-display font-bold text-xl bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-400 dark:to-blue-600 bg-clip-text text-transparent">
              Sistema CRA
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">Comunicação Jurídica</p>
          </div>
        </div>

        {/* Search & Navigation Info */}
        <div className="flex items-center space-x-6 flex-1 justify-center">
          <div className="hidden md:flex items-center space-x-4">
            <div className="relative group">
              
              
            </div>
          </div>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center space-x-3">
          {/* Current Time */}
          <div className="hidden sm:flex flex-col items-end mr-2">
            <div className="text-sm font-medium text-foreground">
              {currentTime.toLocaleDateString('pt-BR', {
              weekday: 'short',
              day: '2-digit',
              month: 'short'
            })}
            </div>
            <div className="text-xs text-muted-foreground">
              {currentTime.toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit'
            })}
            </div>
          </div>

          {/* Notifications - Temporariamente desabilitado até migration ser aprovada */}
          {/* <NotificationBell /> */}

          {/* Theme Toggle */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleTheme} 
            className="hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>

          {/* Settings */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <Settings className="w-5 h-5" />
          </Button>

          {/* User Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-3 py-2 h-auto transition-all">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center shadow-lg ring-2 ring-blue-200 dark:ring-blue-800">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="hidden sm:flex flex-col items-start">
                  <span className="text-sm font-semibold text-foreground">
                    {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuário'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {user?.email}
                  </span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                Perfil
              </DropdownMenuItem>
              <ChangePasswordForm trigger={<div className="flex items-center w-full px-2 py-1.5 text-sm cursor-pointer hover:bg-accent rounded-sm">
                    <Settings className="mr-2 h-4 w-4" />
                    Alterar Senha
                  </div>} />
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>;
};
export default ModernHeader;