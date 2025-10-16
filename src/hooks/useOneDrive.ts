import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useOneDrive = () => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Verificar se há token na URL (retorno do OAuth)
    const params = new URLSearchParams(window.location.search);
    const token = params.get('onedrive_token');
    const refreshToken = params.get('refresh_token');
    
    if (token) {
      setAccessToken(token);
      // Armazenar tokens no localStorage
      localStorage.setItem('onedrive_access_token', token);
      if (refreshToken) {
        localStorage.setItem('onedrive_refresh_token', refreshToken);
      }
      // Limpar URL
      window.history.replaceState({}, document.title, window.location.pathname);
      toast({
        title: "OneDrive conectado!",
        description: "Você está autenticado no OneDrive.",
      });
    } else {
      // Tentar recuperar token do localStorage
      const storedToken = localStorage.getItem('onedrive_access_token');
      if (storedToken) {
        setAccessToken(storedToken);
      }
    }
  }, [toast]);

  const authenticate = async () => {
    setIsAuthenticating(true);
    try {
      const { data, error } = await supabase.functions.invoke('onedrive-auth');
      
      if (error) throw error;
      
      // Abrir popup de autenticação
      window.location.href = data.authUrl;
    } catch (error) {
      console.error('Erro ao autenticar:', error);
      toast({
        title: "Erro na autenticação",
        description: "Não foi possível conectar ao OneDrive.",
        variant: "destructive",
      });
    } finally {
      setIsAuthenticating(false);
    }
  };

  const uploadFile = async (
    file: File,
    folderPath: string = 'Sistema CRA/Anexos'
  ): Promise<{ success: boolean; fileUrl?: string; fileName?: string }> => {
    if (!accessToken) {
      toast({
        title: "OneDrive não conectado",
        description: "Por favor, conecte-se ao OneDrive primeiro.",
        variant: "destructive",
      });
      return { success: false };
    }

    try {
      console.log('[useOneDrive] Iniciando upload:', file.name);
      
      // Converter arquivo para base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      console.log('[useOneDrive] Arquivo convertido para base64, tamanho:', base64.length);

      const { data, error } = await supabase.functions.invoke('onedrive-upload', {
        body: {
          accessToken,
          fileName: file.name,
          fileContent: base64,
          folderPath,
        },
      });

      console.log('[useOneDrive] Resposta da função:', { data, error });

      if (error) {
        console.error('[useOneDrive] Erro na invocação:', error);
        throw error;
      }

      if (data?.error) {
        console.error('[useOneDrive] Erro retornado pela função:', data.error);
        throw new Error(data.error);
      }

      if (data?.success) {
        console.log('[useOneDrive] Upload bem-sucedido:', data.file);
        toast({
          title: "Upload concluído!",
          description: `Arquivo ${data.file.name} enviado para o OneDrive.`,
        });
        return {
          success: true,
          fileUrl: data.file.webUrl,
          fileName: data.file.name,
        };
      }

      throw new Error('Resposta inesperada da função de upload');
    } catch (error) {
      console.error('[useOneDrive] Erro ao fazer upload:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: "Erro no upload",
        description: errorMessage,
        variant: "destructive",
      });
      return { success: false };
    }
  };

  const disconnect = () => {
    localStorage.removeItem('onedrive_access_token');
    localStorage.removeItem('onedrive_refresh_token');
    setAccessToken(null);
    toast({
      title: "OneDrive desconectado",
      description: "Você foi desconectado do OneDrive.",
    });
  };

  return {
    accessToken,
    isAuthenticating,
    isConnected: !!accessToken,
    authenticate,
    uploadFile,
    disconnect,
  };
};
