import React, { useState } from 'react';
import { useAuth } from './AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { LogIn, AlertCircle, CheckCircle2, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import LocationCard from './LocationCard';

const LoginForm = () => {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await signIn(email, password);
    
    if (error) {
      setError('Email ou senha incorretos');
    }
    
    setLoading(false);
  };


  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setResetError(null);
    setResetSuccess(false);

    const redirectUrl = `${window.location.origin}/auth/reset-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: redirectUrl
    });

    if (error) {
      setResetError('Erro ao enviar email de recuperação: ' + error.message);
    } else {
      setResetSuccess(true);
      setTimeout(() => {
        setIsResetDialogOpen(false);
        setResetEmail('');
        setResetSuccess(false);
      }, 3000);
    }

    setResetLoading(false);
  };

  return (
    <>
      <LocationCard />
      <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="login-background"></div>
      
      {/* Logo do escritório no topo */}
      <div className="relative z-10 mb-8">
        <img 
          src="/marca-negativa-principal.png" 
          alt="Calazans Rossi Advogados" 
          className="h-60 w-auto"
        />
      </div>

      <Card className="w-full max-w-md relative z-10 backdrop-blur-sm bg-card/95 border-primary/20">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Sistema Comunicação CRA</CardTitle>
          <CardDescription>
            Acesse sua conta para continuar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="seu.email@exemplo.com"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Digite sua senha"
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              <LogIn className="mr-2 h-4 w-4" />
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>

            <div className="text-center mt-4">
              <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="link" className="text-sm text-muted-foreground">
                    Esqueceu sua senha?
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Recuperar Senha</DialogTitle>
                    <DialogDescription>
                      Digite seu email para receber um link de recuperação de senha.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handlePasswordReset} className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="reset-email">Email</Label>
                      <Input
                        id="reset-email"
                        type="email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        required
                        placeholder="seu.email@exemplo.com"
                      />
                    </div>

                    {resetError && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{resetError}</AlertDescription>
                      </Alert>
                    )}

                    {resetSuccess && (
                      <Alert>
                        <CheckCircle2 className="h-4 w-4" />
                        <AlertDescription>
                          Email de recuperação enviado! Verifique sua caixa de entrada.
                        </AlertDescription>
                      </Alert>
                    )}

                    <Button type="submit" className="w-full" disabled={resetLoading || resetSuccess}>
                      <Mail className="mr-2 h-4 w-4" />
                      {resetLoading ? 'Enviando...' : 'Enviar Link de Recuperação'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
    </>
  );
};

export default LoginForm;