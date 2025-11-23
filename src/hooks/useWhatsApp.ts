import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { openWhatsApp } from '@/lib/utils';

interface EnviarMensagemParams {
  destinatario: string;
  mensagem: string;
  tipo?: 'pendencia' | 'decisao' | 'bloqueio' | 'assistencia' | 'sugestao' | 'erro';
  codigoUnico?: string;
}

export const useWhatsApp = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Tenta enviar mensagem automaticamente via Twilio
   * Se falhar, oferece fallback para envio manual via WhatsApp Web
   */
  const enviarMensagemComFallback = async (params: EnviarMensagemParams): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      console.log('📱 Tentando envio automático via Twilio:', params.tipo);

      const { data, error: envioError } = await supabase.functions.invoke('enviar-whatsapp', {
        body: {
          to: params.destinatario,
          message: params.mensagem,
          tipo: params.tipo,
          codigoUnico: params.codigoUnico
        }
      });

      if (envioError || !data?.success) {
        console.warn('⚠️ Envio automático falhou, usando fallback manual:', envioError);
        
        toast.warning('Enviando pelo WhatsApp Web', {
          description: 'Não foi possível enviar automaticamente. Abrindo WhatsApp Web...'
        });

        // Fallback para método manual
        openWhatsApp(params.mensagem);
        return false;
      }

      console.log('✅ Mensagem enviada automaticamente:', data.messageSid);
      
      toast.success('Mensagem enviada!', {
        description: `WhatsApp enviado automaticamente para ${params.destinatario}`
      });

      return true;

    } catch (error) {
      console.error('❌ Erro no envio WhatsApp:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setError(errorMessage);
      
      toast.warning('Usando envio manual', {
        description: 'Abrindo WhatsApp Web para envio manual...'
      });

      // Fallback para método manual em caso de erro
      openWhatsApp(params.mensagem);
      return false;

    } finally {
      setLoading(false);
    }
  };

  /**
   * Envia mensagem diretamente via Twilio (sem fallback)
   * Retorna true se bem-sucedido, false caso contrário
   */
  const enviarMensagem = async (params: EnviarMensagemParams): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      console.log('📱 Enviando mensagem via Twilio:', params.tipo);

      const { data, error: envioError } = await supabase.functions.invoke('enviar-whatsapp', {
        body: {
          to: params.destinatario,
          message: params.mensagem,
          tipo: params.tipo,
          codigoUnico: params.codigoUnico
        }
      });

      if (envioError) {
        throw new Error(envioError.message);
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Falha no envio da mensagem');
      }

      console.log('✅ Mensagem enviada:', data.messageSid);
      
      toast.success('Mensagem enviada!', {
        description: `WhatsApp enviado para ${params.destinatario}`
      });

      return true;

    } catch (error) {
      console.error('❌ Erro no envio WhatsApp:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setError(errorMessage);
      
      toast.error('Erro ao enviar mensagem', {
        description: errorMessage
      });

      return false;

    } finally {
      setLoading(false);
    }
  };

  /**
   * Testa a configuração do Twilio com uma mensagem de teste
   */
  const testarConfiguracao = async (numeroTeste: string): Promise<boolean> => {
    const mensagemTeste = `🔔 *Teste de Integração WhatsApp - Calazans Rossi*\n\nEsta é uma mensagem de teste para validar a configuração do Twilio WhatsApp.\n\nSe você recebeu esta mensagem, a integração está funcionando corretamente! ✅`;

    return await enviarMensagem({
      destinatario: numeroTeste,
      mensagem: mensagemTeste,
      tipo: 'assistencia',
      codigoUnico: `TEST-${new Date().getTime()}`
    });
  };

  return {
    enviarMensagem,
    enviarMensagemComFallback,
    testarConfiguracao,
    loading,
    error
  };
};