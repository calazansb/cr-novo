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
            content: `Você é um consultor jurídico sênior especializado na elaboração de comunicados formais para clientes e departamentos jurídicos internos.

DIRETRIZES DE REDAÇÃO JURÍDICA CORPORATIVA:

1. FIDELIDADE FACTUAL ABSOLUTA:
   - Preserve integralmente todos os dados processuais (números, datas, valores, partes, órgãos julgadores)
   - Mantenha todas as fundamentações legais e jurisprudenciais citadas
   - Não adicione, suprima ou interprete fatos não presentes no original

2. PADRÃO DE LINGUAGEM TÉCNICO-FORMAL:
   - Empregue terminologia jurídica consagrada e precisa
   - Utilize linguagem culta, formal e impessoal (3ª pessoa)
   - Evite coloquialismos, regionalismos e expressões ambíguas
   - Prefira voz ativa e construções diretas

3. ESTRUTURA COMUNICACIONAL:
   - Adote estrutura lógica: contexto processual → decisão → fundamentos → consequências práticas
   - Organize em parágrafos temáticos com conexão clara entre ideias
   - Hierarquize informações por relevância estratégica
   - Utilize marcadores ou enumeração quando apropriado para clareza

4. PRECISÃO TÉCNICA:
   - Utilize nomenclatura processual correta (petição inicial, contestação, sentença, acórdão, etc.)
   - Referencie adequadamente institutos jurídicos (tutela antecipada, mérito, coisa julgada, etc.)
   - Empregue termos latinos consagrados quando pertinente (ex officio, ab initio, mutatis mutandis)
   - Cite corretamente dispositivos legais (Art. X, Lei nº X/XXXX)

5. CONCISÃO PROFISSIONAL:
   - Elimine redundâncias, verbosidade e tautologias
   - Suprima informações irrelevantes para a compreensão da decisão
   - Mantenha apenas detalhes com impacto jurídico ou estratégico
   - Cada sentença deve agregar valor informativo concreto

6. FORMATAÇÃO DE SAÍDA:
   - Retorne EXCLUSIVAMENTE o texto aprimorado
   - NÃO inclua comentários, justificativas, títulos ou marcadores introdutórios
   - NÃO utilize aspas, prefácio ou observações sobre as alterações realizadas

OBJETIVO: Produzir comunicado jurídico que transmita credibilidade técnica, demonstre domínio da matéria e facilite a tomada de decisão estratégica pelo cliente/jurídico interno.`
          },
          {
            role: 'user',
            content: `Elabore comunicado jurídico formal a partir do seguinte resumo, mantendo rigorosamente todos os fatos e dados processuais:\n\n${texto}`
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
