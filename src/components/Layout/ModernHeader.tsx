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
      <div className="container flex h-16 items-center justify-between px-6">
        {/* Logo */}
        <div className="flex items-center space-x-3">
          <div className="h-10 flex items-center px-[47px] py-[4px] mx-0">
            <img src="/calazans-rossi-logo.png" alt="Calazans Rossi Advogados" className="h-8 w-auto" onError={e => {
            console.error('Erro ao carregar logo');
            e.currentTarget.style.display = 'none';
          }} />
          </div>
          <div className="hidden md:block">
            <h1 className="font-display font-bold text-lg bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent px-[44px] py-px mx-[76px]">Sistema CRA</h1>
            
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
        <div className="flex items-center space-x-4">
          {/* Current Time */}
          <div className="hidden sm:flex flex-col items-end">
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
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="hover:bg-primary/10 hover:text-primary transition-colors">
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>

          {/* Settings */}
          <Button variant="ghost" size="icon" className="hover:bg-primary/10 hover:text-primary transition-colors">
            <Settings className="w-4 h-4" />
          </Button>

          {/* User Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2 hover:bg-primary/10 px-3 transition-all">
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                  <User className="w-4 h-4 text-white" />
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