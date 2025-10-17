const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { texto } = await req.json();
    
    if (!texto || typeof texto !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Texto é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY não está configurada');
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-5',
        messages: [
          {
            role: 'system',
            content: `Você é um especialista em redação jurídica e atua revisando comunicações entre escritórios de advocacia terceirizados e o setor jurídico interno de empresas clientes.

Receberá abaixo o rascunho de uma mensagem que será enviada ao departamento jurídico interno do cliente, solicitando apoio, informações ou sugerindo encaminhamentos.

Reescreva esse texto para:
- Garantir máximo de clareza, cortesia e profissionalismo
- Usar tom colaborativo e respeitoso
- Favorecer sugestões e pedidos, utilizando expressões como: "seria possível", "gostaríamos de contar com", "solicitamos gentilmente", "quando houver disponibilidade"
- Evitar completamente imposição de ordens, linguagem direta ou autoritária
- Adequar o texto ao contexto formal corporativo, sem excesso de rebuscamento
- SER CONCISO E DIRETO: priorize objetividade, evite rodeios e informações desnecessárias
- Mantenha apenas o essencial para a compreensão da solicitação
- Vá direto ao ponto, sem perder a cortesia e o profissionalismo

Se houver partes inadequadas, realize sugestões de reformulação.

Retorne APENAS o texto reescrito, sem comentários adicionais ou marcadores.`
          },
          {
            role: 'user',
            content: texto
          }
        ],
        max_completion_tokens: 4000
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de requisições excedido. Tente novamente em alguns instantes.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Créditos esgotados. Entre em contato com o administrador.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('Erro da API de IA:', response.status, errorText);
      throw new Error('Erro ao processar o texto');
    }

    const data = await response.json();
    const textoMelhorado = data.choices?.[0]?.message?.content;

    if (!textoMelhorado) {
      throw new Error('Resposta inválida da IA');
    }

    return new Response(
      JSON.stringify({ textoMelhorado }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro na função melhorar-texto-juridico:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
