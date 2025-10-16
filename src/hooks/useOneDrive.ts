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
      // Converter arquivo para base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const { data, error } = await supabase.functions.invoke('onedrive-upload', {
        body: {
          accessToken,
          fileName: file.name,
          fileContent: base64,
          folderPath,
        },
      });

      if (error) throw error;

      if (data.success) {
        return {
          success: true,
          fileUrl: data.file.webUrl,
          fileName: data.file.name,
        };
      }

      return { success: false };
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast({
        title: "Erro no upload",
        description: "Não foi possível fazer upload do arquivo para o OneDrive.",
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
