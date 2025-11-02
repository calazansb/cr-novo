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

    // Chamar Lovable AI para análise do texto usando tool calling para garantir estrutura
    const promptAnalise = `Analise o seguinte texto de uma decisão judicial brasileira e extraia todas as informações possíveis.

INSTRUÇÕES CRÍTICAS:

1. TRANSCRIÇÃO LITERAL (Doutrinadores, Precedentes e Termos):
   - TRANSCREVA LITERALMENTE como aparecem no texto
   - NÃO resuma, NÃO parafraseie, NÃO modifique - copie exatamente como está escrito
   - Para termos frequentes: extraia palavras-chave técnicas que aparecem repetidamente
   - Para doutrinadores: extraia nomes de autores citados EXATAMENTE como aparecem
   - Para precedentes: extraia números e descrições de julgados EXATAMENTE como citados

2. RESUMO DA DECISÃO (estrutura obrigatória em 3 partes):
   
   RELATÓRIO/CASO:
   - Explique qual era o caso concreto
   - Identifique as partes envolvidas (autor x réu)
   - Descreva brevemente o que estava sendo discutido/pedido
   
   FUNDAMENTOS:
   - Resuma os principais argumentos jurídicos apresentados na decisão
   - Cite as leis, súmulas ou precedentes que fundamentaram a decisão
   - Explique o raciocínio do magistrado
   
   DISPOSITIVO:
   - Qual foi a decisão final? (ex: "Deram provimento ao recurso", "Negaram provimento", "Deram provimento parcial")
   - Quais as consequências práticas da decisão?

Texto da decisão:
${(baseText || '').slice(0, 20000)}`;

    console.log('Chamando Lovable AI para análise...');

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'Você é um assistente especializado em análise de decisões judiciais brasileiras. Ao extrair o RESUMO, você DEVE estruturá-lo em 3 partes: 1) RELATÓRIO (o caso), 2) FUNDAMENTOS (por que decidiram assim), 3) DISPOSITIVO (qual foi a decisão). Para doutrinadores, precedentes e termos, transcreva LITERALMENTE do texto.'
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
            description: 'Extrai dados estruturados de uma decisão judicial brasileira',
            parameters: {
              type: 'object',
              properties: {
                numeroProcesso: { type: 'string', description: 'Número do processo no formato CNJ' },
                autor: { type: 'string', description: 'Nome completo do autor da ação' },
                reu: { type: 'string', description: 'Nome completo do réu' },
                adverso: { type: 'string', description: 'Nome da parte adversa ao cliente' },
                relator: { type: 'string', description: 'Nome completo do magistrado relator' },
                dataDecisao: { type: 'string', description: 'Data da decisão no formato YYYY-MM-DD' },
                tribunal: { type: 'string', description: 'Tribunal (ex: TJSP, TRF3, STJ, STF)' },
                camaraTurma: { type: 'string', description: 'Câmara ou Turma julgadora' },
                assunto: { type: 'string', description: 'Assunto/Tema principal (máximo 100 caracteres)' },
                tipoDecisao: { type: 'string', enum: ['Sentença', 'Acórdão', 'Decisão Monocrática (Efeito Suspensivo)'], description: 'Tipo de decisão' },
                resultado: { type: 'string', enum: ['Favorável', 'Parcialmente Favorável', 'Desfavorável'], description: 'Resultado para o cliente' },
                poloCliente: { type: 'string', enum: ['Ativo', 'Passivo'], description: 'Polo do cliente (Ativo se autor, Passivo se réu)' },
                valorDisputa: { type: 'number', description: 'Valor em disputa (apenas número)' },
                economiaGerada: { type: 'number', description: 'Economia gerada para o cliente (apenas número)' },
                percentualExonerado: { type: 'number', description: 'Percentual exonerado (0-100)' },
                montanteReconhecido: { type: 'number', description: 'Montante reconhecido (apenas número)' },
                resumo: { 
                  type: 'string', 
                  description: 'Resumo estruturado da decisão contendo: 1) RELATÓRIO/CASO: explicação do caso, partes envolvidas e o que estava sendo discutido; 2) FUNDAMENTOS: principais argumentos e fundamentos jurídicos que motivaram a decisão; 3) DISPOSITIVO: decisão final (proveram, negaram, deram provimento parcial, etc.). Máximo 1000 caracteres.' 
                },
                termosFrequentes: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Array com termos técnico-jurídicos que aparecem repetidamente LITERALMENTE como estão no texto'
                },
                doutrinasCitadas: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Array com nomes de doutrinadores/autores citados LITERALMENTE como aparecem no texto (ex: "José Afonso da Silva", "Celso Antônio Bandeira de Mello")'
                },
                julgadosCitados: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Array com precedentes/julgados citados LITERALMENTE (número do processo e descrição exata como aparece no texto)'
                }
              },
              additionalProperties: false
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
        throw new Error('Limite de requisições da IA excedido. Tente novamente em alguns minutos.');
      }
      if (aiResponse.status === 402) {
        throw new Error('Créditos da IA esgotados. Por favor, adicione créditos ao workspace.');
      }
      
      throw new Error(`Erro na API da IA: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log('Resposta da IA recebida');

    // Tentar extrair via tool calling e, se não vier, fazer fallback para JSON no content
    let dadosExtraidos: any = null;
    const choice = aiData.choices?.[0];
    const toolCall = choice?.message?.tool_calls?.[0];

    if (toolCall?.function?.arguments) {
      try {
        dadosExtraidos = typeof toolCall.function.arguments === 'string'
          ? JSON.parse(toolCall.function.arguments)
          : toolCall.function.arguments;
      } catch (e) {
        console.error('Erro ao parsear argumentos do tool call:', toolCall.function.arguments);
      }
    }

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
              console.error('Erro no fallback de JSON:', e);
            }
          }
        }
      }
    }

    if (!dadosExtraidos) {
      console.error('IA não retornou dados estruturados. Resposta:', JSON.stringify(aiData).slice(0, 1500));
      throw new Error('IA não retornou dados estruturados');
    }

    console.log('Dados extraídos com sucesso:', Object.keys(dadosExtraidos));

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
    console.error('Erro na função analisar-decisao-ia:', error);
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
