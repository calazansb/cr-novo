import { useState, useEffect } from "react";
import { User, LogOut, Calendar, Clock, ChevronDown, Key } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/components/Auth/AuthProvider";
import { ChangePasswordForm } from "@/components/Auth/ChangePasswordForm";
import { HeaderQuote } from "@/components/Motivational/HeaderQuote";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface ModernHeaderProps {
  className?: string;
}

const ModernHeader = ({ className }: ModernHeaderProps) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { user, signOut } = useAuth();
  
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuário';
  const userInitials = userName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  
  return (
    <header className={cn(
      "sticky top-0 z-40 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800",
      className
    )}>
      <div className="flex h-16 items-center justify-between px-4 lg:px-6">
        {/* Left - Motivational Quote */}
        <div className="flex-1 max-w-2xl">
          <HeaderQuote />
        </div>

        {/* Right - Date/Time & User */}
        <div className="flex items-center gap-2 lg:gap-4">
          {/* Date & Time Pill */}
          <div className="hidden md:flex items-center gap-3 bg-slate-100 dark:bg-slate-800 rounded-full px-4 py-2">
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              <Calendar className="w-4 h-4" />
              <span className="text-sm font-medium">
                {currentTime.toLocaleDateString('pt-BR', {
                  weekday: 'short',
                  day: '2-digit',
                  month: 'short'
                })}
              </span>
            </div>
            <div className="w-px h-4 bg-slate-300 dark:bg-slate-600" />
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-semibold tabular-nums">
                {currentTime.toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          </div>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full pl-1 pr-3 py-1.5 h-auto transition-all"
              >
                <Avatar className="h-9 w-9 border-2 border-primary/20">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-white text-sm font-semibold">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden lg:flex flex-col items-start">
                  <span className="text-sm font-semibold text-foreground leading-tight">
                    {userName}
                  </span>
                  <span className="text-xs text-muted-foreground leading-tight truncate max-w-[150px]">
                    {user?.email}
                  </span>
                </div>
                <ChevronDown className="w-4 h-4 text-muted-foreground hidden lg:block" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                <p className="text-sm font-medium">{userName}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
              <DropdownMenuItem className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                Meu Perfil
              </DropdownMenuItem>
              <ChangePasswordForm 
                trigger={
                  <div className="flex items-center w-full px-2 py-1.5 text-sm cursor-pointer hover:bg-accent rounded-sm">
                    <Key className="mr-2 h-4 w-4" />
                    Alterar Senha
                  </div>
                } 
              />
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="text-destructive cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                Sair do Sistema
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default ModernHeader;