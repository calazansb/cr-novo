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

    const promptAnalise = `Você deve extrair informações de uma decisão judicial brasileira. Leia o texto COM ATENÇÃO e preencha os campos abaixo.

INSTRUÇÕES SIMPLES:

1. NÚMERO DO PROCESSO: Procure padrões como "0001234-56.2023.8.13.0024" ou "1.0000.22.136607-3/002". Copie exatamente.

2. AUTOR: Procure "AUTOR:", "APELANTE:", "REQUERENTE:". Pegue só o nome (sem "Dr.", "Dra.", "Exmo.").

3. RÉU: Procure "RÉU:", "APELADO:", "REQUERIDO:". Pegue só o nome (sem títulos).

4. RELATOR/JUIZ: Procure "Relator:", "Juiz:", "Desembargador:". Pegue o nome SEM título.

5. DATA: Procure "julgado em" ou datas no formato DD/MM/YYYY. Converta para YYYY-MM-DD.

6. TRIBUNAL: TJMG, TJSP, TRF3, STJ, etc. Procure no cabeçalho.

7. CÂMARA/VARA: "10ª CÂMARA CÍVEL", "3ª Turma", "7ª Vara Cível", etc.

8. TIPO DE DECISÃO:
   - Se menciona "acórdão" ou tem "câmara/turma" → "Acórdão"
   - Se menciona "sentença" → "Sentença"
   - Se menciona "monocrática" → "Decisão Monocrática (Efeito Suspensivo)"

9. RESULTADO (leia a parte final/dispositivo):
   - "deram provimento" ou "procedente" → "Favorável"
   - "negaram provimento" ou "improcedente" → "Desfavorável"  
   - "parcial" → "Parcialmente Favorável"

10. VALORES: Procure "R$". Extraia apenas números (ex: 50000.00).

11. ASSUNTO: Resuma o tema em até 100 caracteres (ex: "Plano de saúde - negativa de cobertura").

12. RESUMO: Faça em 3 partes:
    - RELATÓRIO/CASO: Quem processou quem e por quê
    - FUNDAMENTOS: Leis e argumentos usados
    - DISPOSITIVO: Decisão final (proveram/negaram)

SE NÃO ENCONTRAR ALGO, DEIXE VAZIO. NÃO INVENTE.

===== TEXTO DA DECISÃO =====

${(baseText || '').slice(0, 50000)}`;

    console.log('Chamando Lovable AI...');

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          {
            role: 'system',
            content: 'Você é especialista em extrair dados de decisões judiciais. Leia COM ATENÇÃO e seja PRECISO. Se não encontrar algo, deixe vazio. NUNCA invente.'
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
