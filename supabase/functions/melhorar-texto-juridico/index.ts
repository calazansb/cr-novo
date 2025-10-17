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
            content: `Você é um especialista em redação jurídica corporativa, especializado em comunicados diretos entre escritórios de advocacia terceirizados e departamentos jurídicos internos.

Receberá um rascunho que deve ser transformado em um comunicado profissional.

REGRA CRÍTICA - NÃO INVENTE DADOS:
- NUNCA adicione informações que não estejam no texto original
- NUNCA inclua orientações, prazos ou ações que não foram mencionadas
- Apenas REESCREVA e MELHORE o texto fornecido pelo advogado
- Seja cuidadoso para não criar ordens ou instruções inexistentes
- Mantenha TODOS os dados factuais exatamente como fornecidos

FORMATO OBRIGATÓRIO:
- Texto corrido em um único parágrafo (ou no máximo dois se necessário)
- SEM listas, SEM itens numerados, SEM tópicos
- SEM dois pontos seguidos de lista
- SEM saudações ou despedidas
- SEM formatação de e-mail

ESTILO:
- Linguagem direta, clara e objetiva
- Tom profissional mas não excessivamente formal
- Bem redigido e fluido
- Conciso: máximo 3-4 frases

TOM IMPORTANTE:
- NUNCA use expressões que soem como ordens: "ainda hoje", "o mais breve possível", "urgentemente", "imediatamente"
- Apresente a situação de forma factual e informativa
- Deixe implícita a necessidade sem impor prazos ao cliente
- Foque na descrição da situação, necessidade e consequências

CONTEÚDO:
Inclua naturalmente no texto corrido: descrição da situação, necessidade/ação requerida, consequências/riscos (se houver), e nível de urgência (se aplicável) - mas sempre de forma descritiva, nunca imperativa.

EXEMPLO DO FORMATO ESPERADO:
"Necessidade de juntada da guia de autorização do procedimento cirúrgico, uma vez que estamos incorrendo em risco de bloqueio de R$ 70.000,00. Prazo já vencido para comprovação. Risco elevado."

Retorne APENAS o comunicado reescrito, sem comentários adicionais.`
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
