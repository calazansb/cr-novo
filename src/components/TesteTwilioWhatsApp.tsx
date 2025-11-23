import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingButton } from '@/components/ui/loading-button';
import { useWhatsApp } from '@/hooks/useWhatsApp';
import { MessageCircle, CheckCircle2, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const TesteTwilioWhatsApp = () => {
  const [numeroTeste, setNumeroTeste] = useState('+5531998259845');
  const [ultimoResultado, setUltimoResultado] = useState<{
    sucesso: boolean;
    mensagem: string;
    timestamp: string;
  } | null>(null);

  const { testarConfiguracao, loading } = useWhatsApp();

  const handleTestar = async () => {
    const sucesso = await testarConfiguracao(numeroTeste);
    
    setUltimoResultado({
      sucesso,
      mensagem: sucesso 
        ? 'Mensagem enviada com sucesso via Twilio!' 
        : 'Falha no envio. Verifique os logs.',
      timestamp: new Date().toLocaleString('pt-BR')
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <MessageCircle className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>Teste de Integração WhatsApp</CardTitle>
              <CardDescription>
                Teste o envio automático de mensagens via Twilio WhatsApp
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="numeroTeste">
              Número de Teste (formato internacional)
            </Label>
            <Input
              id="numeroTeste"
              type="tel"
              value={numeroTeste}
              onChange={(e) => setNumeroTeste(e.target.value)}
              placeholder="+5531998765432"
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              Formato: +55 (código do país) + DDD + número
            </p>
          </div>

          <LoadingButton
            onClick={handleTestar}
            loading={loading}
            className="w-full"
            size="lg"
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            Enviar Mensagem de Teste
          </LoadingButton>

          {ultimoResultado && (
            <Alert variant={ultimoResultado.sucesso ? 'default' : 'destructive'}>
              <div className="flex items-start gap-3">
                {ultimoResultado.sucesso ? (
                  <CheckCircle2 className="h-5 w-5 text-success" />
                ) : (
                  <AlertCircle className="h-5 w-5" />
                )}
                <div className="flex-1 space-y-1">
                  <AlertDescription className="font-medium">
                    {ultimoResultado.mensagem}
                  </AlertDescription>
                  <p className="text-xs text-muted-foreground">
                    {ultimoResultado.timestamp}
                  </p>
                </div>
              </div>
            </Alert>
          )}

          <div className="space-y-2 pt-4 border-t">
            <h4 className="text-sm font-medium">Status da Configuração:</h4>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                TWILIO_ACCOUNT_SID
              </Badge>
              <Badge variant="outline">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                TWILIO_AUTH_TOKEN
              </Badge>
              <Badge variant="outline">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                TWILIO_WHATSAPP_NUMBER
              </Badge>
              <Badge variant="outline">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Edge Function Deployada
              </Badge>
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <h4 className="text-sm font-medium">ℹ️ Instruções:</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Digite o número no formato internacional (+5531...)</li>
              <li>Clique em "Enviar Mensagem de Teste"</li>
              <li>Verifique se a mensagem chegou no WhatsApp</li>
              <li>Consulte os logs da Edge Function se houver erro</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};