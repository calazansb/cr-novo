import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.78.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { filePath, fileName, fileText: providedText } = await req.json();
    
    if (!filePath) {
      throw new Error('filePath é obrigatório');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY não configurada');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Usar o texto fornecido pelo cliente quando disponível; caso contrário, baixar do storage
    let baseText: string | null = (providedText && typeof providedText === 'string' ? providedText : null);

    if (!baseText || baseText.length < 200) {
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('decisoes-judiciais')
        .download(filePath);

      if (downloadError) {
        console.error('Erro ao baixar arquivo:', downloadError);
        throw new Error(`Erro ao baixar arquivo: ${downloadError.message}`);
      }

      baseText = await fileData.text();
    }
    
    console.log('Tamanho do texto para IA:', baseText?.length || 0);

    const promptAnalise = `Analise esta decisão judicial e PREENCHA TODOS OS CAMPOS abaixo. Leia TODO o texto COM ATENÇÃO.

CAMPOS OBRIGATÓRIOS (preencha TODOS):

numeroProcesso: [procure padrão 0000000-00.0000.0.00.0000 ou similar]
autor: [procure "AUTOR:", "APELANTE:", "REQUERENTE:" - apenas o nome]
reu: [procure "RÉU:", "APELADO:", "REQUERIDO:" - apenas o nome]
adverso: [parte contrária ao cliente]
relator: [procure "Relator:", "Juiz:" - apenas o nome, sem título]
dataDecisao: [formato YYYY-MM-DD]
tribunal: [TJMG, TJSP, STJ, etc]
camaraTurma: [ex: "10ª CÂMARA CÍVEL", "3ª Turma"]
assunto: [tema principal em até 100 caracteres]
tipoDecisao: [escolha: "Sentença", "Acórdão", ou "Decisão Monocrática (Efeito Suspensivo)"]
resultado: [escolha: "Favorável", "Parcialmente Favorável", ou "Desfavorável"]
poloCliente: [escolha: "Ativo" ou "Passivo"]
valorDisputa: [valor em reais, apenas número]
economiaGerada: [economia em reais, apenas número]
percentualExonerado: [percentual 0-100]
montanteReconhecido: [valor em reais, apenas número]
resumo: [faça um resumo em 3 partes: RELATÓRIO/CASO, FUNDAMENTOS, DISPOSITIVO]

IMPORTANTE:
- Leia TODO o texto antes de responder
- Procure CADA informação solicitada
- Se não encontrar algo específico, deixe vazio ou null
- NÃO invente informações
- Seja PRECISO

===== TEXTO COMPLETO DA DECISÃO =====

${(baseText || '').slice(0, 50000)}

===== FIM DO TEXTO =====

Agora preencha TODOS os campos acima com base no texto.

    console.log('Chamando Lovable AI...');

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-5-mini',
        messages: [
          {
            role: 'system',
            content: 'Você DEVE preencher TODOS os campos solicitados. Leia o texto INTEIRO com ATENÇÃO. Procure cada informação com CUIDADO. Se não encontrar, deixe null, mas TENTE ENCONTRAR primeiro.'
          },
          {
            role: 'user',
            content: promptAnalise
          }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'extrair_dados_decisao',
            description: 'Extrai dados de decisão judicial',
            parameters: {
              type: 'object',
              properties: {
                numeroProcesso: { type: 'string' },
                autor: { type: 'string' },
                reu: { type: 'string' },
                adverso: { type: 'string' },
                relator: { type: 'string' },
                dataDecisao: { type: 'string' },
                tribunal: { type: 'string' },
                camaraTurma: { type: 'string' },
                assunto: { type: 'string' },
                tipoDecisao: { type: 'string', enum: ['Sentença', 'Acórdão', 'Decisão Monocrática (Efeito Suspensivo)'] },
                resultado: { type: 'string', enum: ['Favorável', 'Parcialmente Favorável', 'Desfavorável'] },
                poloCliente: { type: 'string', enum: ['Ativo', 'Passivo'] },
                valorDisputa: { type: 'number' },
                economiaGerada: { type: 'number' },
                percentualExonerado: { type: 'number' },
                montanteReconhecido: { type: 'number' },
                resumo: { type: 'string' },
                normasLegaisCitadas: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      tipo: { type: 'string' },
                      nome: { type: 'string' },
                      artigos: { type: 'array', items: { type: 'string' } }
                    }
                  }
                },
                doutrinasCitadas: { type: 'array', items: { type: 'string' } },
                julgadosCitados: { type: 'array', items: { type: 'string' } }
              }
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'extrair_dados_decisao' } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Erro na API da IA:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        throw new Error('Limite de requisições excedido. Tente novamente em alguns minutos.');
      }
      if (aiResponse.status === 402) {
        throw new Error('Créditos esgotados. Adicione créditos ao workspace.');
      }
      
      throw new Error(`Erro na API da IA: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log('Resposta recebida');

    // Extrair dados do tool call
    let dadosExtraidos: any = null;
    const choice = aiData.choices?.[0];
    const toolCall = choice?.message?.tool_calls?.[0];

    if (toolCall?.function?.arguments) {
      try {
        dadosExtraidos = typeof toolCall.function.arguments === 'string'
          ? JSON.parse(toolCall.function.arguments)
          : toolCall.function.arguments;
      } catch (e) {
        console.error('Erro ao parsear tool call:', e);
      }
    }

    // Fallback para content
    if (!dadosExtraidos) {
      const aiContent = choice?.message?.content;
      if (aiContent) {
        try {
          dadosExtraidos = JSON.parse(aiContent);
        } catch {
          const jsonMatch = aiContent.match(/```json\s*([\s\S]*?)\s*```/) || 
                            aiContent.match(/```\s*([\s\S]*?)\s*```/) ||
                            aiContent.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            try {
              dadosExtraidos = JSON.parse(jsonMatch[1] || jsonMatch[0]);
            } catch (e) {
              console.error('Erro no fallback:', e);
            }
          }
        }
      }
    }

    if (!dadosExtraidos) {
      console.error('IA não retornou dados. Resposta:', JSON.stringify(aiData).slice(0, 2000));
      throw new Error('IA não retornou dados estruturados');
    }

    console.log('Dados extraídos:', Object.keys(dadosExtraidos));

    return new Response(
      JSON.stringify({ 
        success: true,
        dadosExtraidos,
        fileName
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Erro:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        details: error instanceof Error ? error.stack : undefined
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
