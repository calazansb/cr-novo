import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function OneDriveCallback() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Conectar OneDrive | Calazans Rossi';

    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');

    const exchange = async () => {
      if (!code) {
        setError('Código ausente na URL.');
        return;
      }
      try {
        const { data, error } = await supabase.functions.invoke('onedrive-callback', {
          body: { code },
        });
        if (error) throw error;
        if (!data?.access_token) throw new Error('Token não retornado.');

        // Persistir tokens conforme esperado pelo hook useOneDrive
        localStorage.setItem('onedrive_access_token', data.access_token);
        if (data.refresh_token) {
          localStorage.setItem('onedrive_refresh_token', data.refresh_token);
        }

        // Limpar querystring e navegar
        window.history.replaceState({}, document.title, window.location.pathname);
        toast({ title: 'OneDrive conectado!', description: 'Autenticação concluída com sucesso.' });
        navigate('/', { replace: true });
      } catch (e: any) {
        console.error('[OneDriveCallback] Falha na troca de código', e);
        setError(e?.message ?? 'Falha ao conectar ao OneDrive.');
        toast({ title: 'Erro ao conectar', description: 'Tente novamente.', variant: 'destructive' });
      }
    };

    exchange();
  }, [navigate, toast]);

  return (
    <main className="min-h-screen flex items-center justify-center">
      <section className="text-center space-y-2">
        <h1 className="text-xl font-semibold">Conectando ao OneDrive…</h1>
        {error ? (
          <p className="text-destructive-foreground text-sm">{error}</p>
        ) : (
          <p className="text-muted-foreground text-sm">Aguarde alguns instantes…</p>
        )}
      </section>
    </main>
  );
}
