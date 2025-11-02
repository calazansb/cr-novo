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
    const { filePath, fileName } = await req.json();
    
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

    // Baixar o arquivo do storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('decisoes-judiciais')
      .download(filePath);

    if (downloadError) {
      console.error('Erro ao baixar arquivo:', downloadError);
      throw new Error(`Erro ao baixar arquivo: ${downloadError.message}`);
    }

    // Converter o arquivo para texto (simplificado - em produção usar OCR para PDFs)
    const fileText = await fileData.text();
    
    console.log('Arquivo baixado, tamanho:', fileText.length);

    // Chamar Lovable AI para análise do texto usando tool calling para garantir estrutura
    const promptAnalise = `Analise o seguinte texto de uma decisão judicial brasileira e extraia todas as informações possíveis.

Texto da decisão:
${fileText.substring(0, 20000)}`;

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
            content: 'Você é um assistente especializado em análise de documentos jurídicos brasileiros. Extraia todas as informações possíveis do documento.'
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
                resumo: { type: 'string', description: 'Resumo objetivo da decisão (máximo 500 caracteres)' },
                termosFrequentes: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      termo: { type: 'string' },
                      frequencia: { type: 'number' }
                    }
                  },
                  description: '10 termos jurídicos mais frequentes'
                },
                doutrinasCitadas: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      doutrinador: { type: 'string' },
                      obra: { type: 'string' },
                      trecho: { type: 'string' },
                      fonte: { type: 'string' }
                    }
                  },
                  description: 'Doutrinas citadas no documento'
                },
                julgadosCitados: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      numeroProcesso: { type: 'string' },
                      tribunal: { type: 'string' },
                      data: { type: 'string' },
                      trecho: { type: 'string' },
                      fonte: { type: 'string' }
                    }
                  },
                  description: 'Julgados citados no documento'
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

    // Extrair dados do tool call
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall || !toolCall.function?.arguments) {
      console.error('Resposta da IA não contém tool call:', JSON.stringify(aiData));
      throw new Error('IA não retornou dados estruturados');
    }

    let dadosExtraidos;
    try {
      dadosExtraidos = typeof toolCall.function.arguments === 'string' 
        ? JSON.parse(toolCall.function.arguments)
        : toolCall.function.arguments;
    } catch (error) {
      console.error('Erro ao parsear argumentos do tool call:', toolCall.function.arguments);
      throw new Error('Não foi possível parsear os dados extraídos pela IA');
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
