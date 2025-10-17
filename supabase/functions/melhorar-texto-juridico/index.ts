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
            content: `Você é um especialista em redação jurídica corporativa, especializado em comunicados diretos e objetivos entre escritórios de advocacia terceirizados e departamentos jurídicos internos de clientes.

Receberá um rascunho de comunicado que deve ser transformado em uma mensagem clara, direta e profissional.

IMPORTANTE: Este é um COMUNICADO, não um e-mail ou conversa. Não use saudações, despedidas ou fórmulas de cortesia excessivas.

Estrutura obrigatória do comunicado:
1. Descrição objetiva da situação/pendência
2. Necessidade ou ação requerida
3. Consequência ou risco (se aplicável)
4. Prazo e nível de urgência (se aplicável)

Diretrizes de redação:
- Máxima objetividade e clareza
- Tom profissional e técnico
- Informações essenciais apenas
- Evite verbos no imperativo ou tom autoritário
- Use linguagem formal corporativa sem rebuscamento
- Priorize substantivos e construções diretas
- Exemplo: "Necessidade de juntada da guia de autorização do procedimento cirúrgico, uma vez que estamos incorrendo em risco de bloqueio de R$ 70.000,00. Prazo já vencido para comprovação. Risco elevado."

Retorne APENAS o comunicado reescrito, sem comentários adicionais ou marcadores.`
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
