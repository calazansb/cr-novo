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
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `Você é um assistente jurídico especializado em aprimorar textos de resumos de decisões judiciais.

REGRAS CRÍTICAS:
1. MANTENHA RIGOROSAMENTE todos os fatos, datas, nomes, valores e detalhes originais - NÃO invente ou altere informações
2. CORRIJA erros de português, gramática e concordância
3. REDIJA de forma DIRETA, TÉCNICA e CONCISA - elimine redundâncias e palavras desnecessárias
4. USE terminologia jurídica PRECISA e apropriada
5. ESTRUTURE o texto de forma PROFISSIONAL e OBJETIVA, priorizando clareza
6. MANTENHA apenas as informações RELEVANTES e ESSENCIAIS para compreensão da decisão
7. Retorne APENAS o texto melhorado, sem comentários, explicações ou marcadores adicionais
8. O texto deve ser ROBUSTO mas ENXUTO - cada palavra deve agregar valor

ESTILO: Profissional, técnico-jurídico, direto ao ponto, sem prolixidade.`
          },
          {
            role: 'user',
            content: `Melhore este resumo de decisão judicial mantendo todos os fatos e informações originais, apenas corrigindo português e tornando a redação mais técnica:\n\n${texto}`
          }
        ],
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
