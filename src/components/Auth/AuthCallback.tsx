import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

const parseHashParams = () => {
  const hash = typeof window !== 'undefined' ? window.location.hash.replace(/^#/, '') : '';
  const params = new URLSearchParams(hash);
  return {
    access_token: params.get('access_token'),
    refresh_token: params.get('refresh_token'),
    type: params.get('type'),
    error: params.get('error') || params.get('error_description'),
  };
};

export const AuthCallback = () => {
  const [status, setStatus] = useState<'loading'|'success'|'error'>('loading');
  const [message, setMessage] = useState<string>('Processando confirmação...');
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const handleAuthCallback = async () => {
      if (!supabase) {
        setStatus('error');
        setMessage('Serviço de autenticação indisponível.');
        return;
      }

      try {
        const { access_token, refresh_token, error } = parseHashParams();
        if (error) {
          console.warn('⚠️ Erro na URL de callback:', error);
          setStatus('error');
          setMessage(error);
          return;
        }

        // 1) Se vierem tokens no hash, aplica diretamente
        if (access_token && refresh_token) {
          const { error: setErr } = await supabase.auth.setSession({ access_token, refresh_token });
          if (setErr) throw setErr;
        } else {
          // 2) Tenta recuperar sessão existente
          const { data } = await supabase.auth.getSession();
          if (!data.session) {
            // 3) Como fallback, tenta trocar código (PKCE) se existir na URL
            try {
              const { error: exErr } = await supabase.auth.exchangeCodeForSession(window.location.href);
              if (exErr) {
                console.warn('Sem código de PKCE na URL ou erro ao trocar:', exErr.message);
              }
            } catch (ex) {
              console.warn('exchangeCodeForSession falhou:', ex);
            }
          }
        }

        // Sessão pronta?
        const { data: final } = await supabase.auth.getSession();
        if (final.session) {
          setStatus('success');
          setMessage('Conta confirmada com sucesso! Redirecionando...');
          toast({ title: 'Conta confirmada', description: 'Login efetuado. Bem-vindo!' });
          // Limpa hash da URL e vai para Home
          const cleanUrl = window.location.origin + '/';
          window.history.replaceState({}, document.title, cleanUrl);
          setTimeout(() => navigate('/'), 800);
          return;
        }

        // Se não entrou em sessão, pelo menos confirma visualmente
        setStatus('success');
        setMessage('Email confirmado. Você já pode fazer login.');
        toast({ title: 'Email confirmado', description: 'Faça login com suas credenciais.' });
        const cleanUrl = window.location.origin + '/';
        window.history.replaceState({}, document.title, cleanUrl);
      } catch (err: any) {
        console.error('Erro no callback de autenticação:', err);
        setStatus('error');
        setMessage(err?.message || 'Falha ao confirmar. Tente novamente.');
      }
    };

    handleAuthCallback();
  }, [navigate, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle>Confirmando acesso</CardTitle>
          <CardDescription>Finalizando sua autenticação...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'loading' && (
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Processando...
            </div>
          )}
          {status === 'success' && (
            <div className="flex items-center justify-center gap-2 text-success">
              <CheckCircle className="w-5 h-5" /> {message}
            </div>
          )}
          {status === 'error' && (
            <div className="flex items-center justify-center gap-2 text-destructive">
              <XCircle className="w-5 h-5" /> {message}
            </div>
          )}
          <div className="pt-2">
            <Button variant="outline" onClick={() => navigate('/')}>Ir para a Home</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthCallback;
