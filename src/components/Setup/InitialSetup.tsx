import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { LoadingButton } from '@/components/ui/loading-button';
import { UserPlus } from 'lucide-react';

export const InitialSetup = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const criarUsuarioInicial = async () => {
    if (!supabase) {
      toast({
        title: "Erro de configuração",
        description: "Sistema de autenticação não disponível",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      // Criar usuário usando signup normal (não requer permissões de admin)
      const { data, error } = await supabase.auth.signUp({
        email: 'bernardo@calazansrossi.com.br',
        password: '12243648',
        options: {
          data: {
            full_name: 'Bernardo Calazans Rossi',
            role: 'admin'
          }
        }
      });

      if (error) {
        toast({
          title: "Erro ao criar usuário inicial",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Usuário criado com sucesso!",
        description: "Verifique o email bernardo@calazansrossi.com.br para confirmar a conta",
      });

      // Marcar que o setup inicial foi completado e remover flag de força
      localStorage.setItem('initial_setup_completed', 'true');
      localStorage.removeItem('force_initial_setup');

      // Recarregar a página para mostrar o formulário de login
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error) {
      toast({
        title: "Erro inesperado",
        description: "Erro ao criar usuário inicial",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto flex items-center justify-center">
            <img 
              src="/calazans-rossi-logo.png" 
              alt="Calazans Rossi Advogados" 
              className="h-16 w-auto"
              onError={(e) => {
                console.error('Erro ao carregar logo no setup');
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
          <CardTitle className="flex items-center justify-center gap-2">
            <UserPlus className="w-6 h-6" />
            Configuração Inicial
          </CardTitle>
          <CardDescription>
            Crie o primeiro usuário administrador para acessar o sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm font-medium">Usuário Administrador:</p>
            <p className="text-sm text-muted-foreground">bernardo@calazansrossi.com.br</p>
            <p className="text-sm text-muted-foreground">Senha: 12243648</p>
          </div>
          
          <LoadingButton 
            onClick={criarUsuarioInicial}
            loading={isLoading}
            className="w-full"
          >
            Criar Usuário Administrador
          </LoadingButton>
        </CardContent>
      </Card>
    </div>
  );
};