// Deno Edge Function para enviar mensagens via Twilio WhatsApp

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EnviarWhatsAppRequest {
  to: string; // Número destino no formato +5531998765432
  message: string; // Mensagem formatada
  tipo?: 'pendencia' | 'decisao' | 'bloqueio' | 'assistencia' | 'sugestao' | 'erro';
  codigoUnico?: string; // Para rastreamento
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, message, tipo, codigoUnico }: EnviarWhatsAppRequest = await req.json();

    console.log('📱 Iniciando envio WhatsApp:', { to, tipo, codigoUnico });

    // Validação de entrada
    if (!to || !message) {
      console.error('❌ Dados inválidos:', { to: !!to, message: !!message });
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Número de destino e mensagem são obrigatórios' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validar formato do número (deve começar com +)
    if (!to.startsWith('+')) {
      console.error('❌ Formato de número inválido:', to);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Número deve estar no formato internacional (+5531...)'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Obter credenciais do Twilio
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const whatsappNumber = Deno.env.get('TWILIO_WHATSAPP_NUMBER');

    if (!accountSid || !authToken || !whatsappNumber) {
      console.error('❌ Credenciais Twilio não configuradas');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Credenciais do Twilio não configuradas'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('🔑 Credenciais Twilio verificadas');

    // Preparar autenticação Basic
    const auth = btoa(`${accountSid}:${authToken}`);

    // Construir URL da API Twilio
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

    // Preparar corpo da requisição
    const body = new URLSearchParams({
      From: whatsappNumber, // whatsapp:+14155238886
      To: `whatsapp:${to}`,
      Body: message
    });

    console.log('📤 Enviando mensagem para Twilio:', { from: whatsappNumber, to });

    // Enviar mensagem via Twilio
    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString()
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Erro na API Twilio:', data);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: data.message || 'Erro ao enviar mensagem via Twilio',
          details: data
        }),
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('✅ Mensagem enviada com sucesso:', data.sid);

    return new Response(
      JSON.stringify({ 
        success: true,
        messageSid: data.sid,
        status: data.status,
        dateCreated: data.date_created,
        codigoUnico
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ Erro no envio WhatsApp:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});