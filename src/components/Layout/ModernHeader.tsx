import { useState, useEffect } from "react";
import { User, LogOut } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/components/Auth/AuthProvider";
import { ChangePasswordForm } from "@/components/Auth/ChangePasswordForm";
import { HeaderQuote } from "@/components/Motivational/HeaderQuote";
import { cn } from "@/lib/utils";
interface ModernHeaderProps {
  className?: string;
}
const ModernHeader = ({
  className
}: ModernHeaderProps) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const {
    user,
    signOut
  } = useAuth();
  
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  
  return <header className={cn("sticky top-0 z-40 w-full border-b border-slate-200/20 dark:border-slate-700/30 bg-gradient-to-r from-white/80 via-slate-50/80 to-white/80 dark:from-slate-900/80 dark:via-slate-800/80 dark:to-slate-900/80 backdrop-blur-xl shadow-lg", className)}>
      <div className="container flex h-20 items-center justify-between px-6">
        {/* Frase Motivacional */}
        <div className="flex-1">
          <HeaderQuote />
        </div>

        {/* Right Side - Data/Hora e Usuário mais próximos */}
        <div className="flex items-center space-x-4 flex-shrink-0">
          {/* Current Time - Mais próximo do usuário */}
          <div className="hidden sm:flex flex-col items-end">
            <div className="text-base font-bold text-foreground">
              {currentTime.toLocaleDateString('pt-BR', {
              weekday: 'short',
              day: '2-digit',
              month: 'short'
            })}
            </div>
            <div className="text-sm font-semibold text-muted-foreground">
              {currentTime.toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit'
            })}
            </div>
          </div>

          {/* User Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-3 hover:bg-blue-50 dark:hover:bg-blue-500/10 px-3 py-2 h-auto transition-all">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg ring-2 ring-blue-100 dark:ring-blue-400/30">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="hidden sm:flex flex-col items-start">
                  <span className="text-sm font-bold text-foreground">
                    {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuário'}
                  </span>
                  <span className="text-xs font-semibold text-muted-foreground">
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
                    <User className="mr-2 h-4 w-4" />
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