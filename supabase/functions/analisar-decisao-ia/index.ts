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
    const promptAnalise = `Você é um especialista em análise de decisões judiciais brasileiras. Analise CUIDADOSAMENTE o texto abaixo e extraia TODAS as informações solicitadas.

REGRAS CRÍTICAS DE EXTRAÇÃO:

1. NÚMERO DO PROCESSO:
   - Procure pelo padrão: 7 dígitos-2 dígitos.4 dígitos.1 dígito.2 dígitos.4 dígitos
   - Exemplo: 0001234-56.2023.8.13.0024
   - Procure também formatos como: 1.0000.22.136607-3/002

2. PARTES (AUTOR e RÉU):
   - Procure por "AUTOR:" ou "REQUERENTE:" ou "APELANTE:" ou início do texto
   - Procure por "RÉU:" ou "REQUERIDO:" ou "APELADO:"
   - IGNORE prefixos como "EXMO. SR. DR.", "MM. JUIZ", etc.
   - Extraia APENAS o nome da pessoa/empresa

3. MAGISTRADO/RELATOR:
   - Procure por "Relator:", "Relatora:", "Juiz:", "Juíza:", "Desembargador:", "Desembargadora:"
   - Extraia o nome completo SEM título (sem "Des.", "Dra.", etc.)

4. TRIBUNAL E CÂMARA:
   - Tribunal: TJSP, TJMG, TRF1, TRF3, STJ, STF, etc.
   - Câmara/Turma: "10ª CÂMARA CÍVEL", "3ª Turma", "7ª Vara Cível", etc.

5. DATA DA DECISÃO:
   - Procure por "julgado em", "decidido em", "data do julgamento"
   - Formato: YYYY-MM-DD (converta se necessário)

6. TIPO DE DECISÃO:
   - Se menciona "acórdão" ou "câmara" ou "turma" → "Acórdão"
   - Se menciona "sentença" ou é de primeira instância → "Sentença"
   - Se menciona "decisão monocrática" → "Decisão Monocrática (Efeito Suspensivo)"

7. RESULTADO:
   - Leia o DISPOSITIVO final da decisão
   - "deram provimento" ou "procedente" → "Favorável"
   - "negaram provimento" ou "improcedente" → "Desfavorável"
   - "deram provimento parcial" ou "parcialmente procedente" → "Parcialmente Favorável"

8. VALORES MONETÁRIOS:
   - Procure por "R$", "reais", valores em litígio
   - Extraia APENAS números (converta milhares/milhões se necessário)
   - valorDisputa: valor total em discussão
   - economiaGerada: economia/benefício para o cliente
   - montanteReconhecido: valor reconhecido na decisão

9. ASSUNTO/TEMA:
   - Identifique o tema principal (máx 100 caracteres)
   - Exemplos: "Plano de saúde - negativa de cobertura", "INSS - auxílio-doença", etc.

10. POLO DO CLIENTE:
    - Se o cliente é AUTOR/APELANTE → "Ativo"
    - Se o cliente é RÉU/APELADO → "Passivo"

11. CITAÇÕES (copiar LITERALMENTE):
    - Doutrinas: copie a referência bibliográfica COMPLETA + trecho
    - Julgados: copie tribunal, número, ementa e trechos citados
    - Normas: liste TODAS as leis/artigos citados

12. RESUMO ESTRUTURADO (obrigatório em 3 seções):
    
    **RELATÓRIO/CASO:**
    [Explique: Quem processou quem? Por quê? O que foi pedido?]
    
    **FUNDAMENTOS:**
    [Quais leis/precedentes foram usados? Qual o raciocínio do juiz?]
    
    **DISPOSITIVO:**
    [Qual foi a decisão? Proveram/Negaram? Consequências práticas?]

IMPORTANTE: Se NÃO encontrar uma informação no texto, deixe em branco ou null. NÃO invente dados.

===== TEXTO DA DECISÃO =====

${(baseText || '').slice(0, 40000)}`;

    console.log('Chamando Lovable AI para análise...');

    console.log('Chamando Lovable AI para análise...');

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
            content: 'Você é um assistente jurídico especializado em análise de decisões judiciais brasileiras. Sua função é extrair dados com MÁXIMA PRECISÃO. Procure CUIDADOSAMENTE por cada informação no texto. Se não encontrar, deixe em branco. NUNCA invente dados. Ao copiar citações de doutrina e precedentes, copie LITERALMENTE como está no texto original.'
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
                numeroProcesso: { 
                  type: 'string', 
                  description: 'Número do processo no formato CNJ (ex: 0001234-56.2023.8.13.0024 ou 1.0000.22.136607-3/002). Procure por padrões com hífens, pontos e barras.'
                },
                autor: { 
                  type: 'string', 
                  description: 'Nome completo do autor/apelante/requerente da ação. Procure após "AUTOR:", "APELANTE:", "REQUERENTE:". Remova títulos como "EXMO.", "SR.", "DRA."'
                },
                reu: { 
                  type: 'string', 
                  description: 'Nome completo do réu/apelado/requerido. Procure após "RÉU:", "APELADO:", "REQUERIDO:". Remova títulos.'
                },
                adverso: { 
                  type: 'string', 
                  description: 'Nome da parte contrária ao cliente (geralmente o mesmo que réu ou autor, dependendo do polo)'
                },
                relator: { 
                  type: 'string', 
                  description: 'Nome completo do magistrado relator/juiz. Procure após "Relator:", "Juiz:", "Desembargador:". Remova "Des.", "Dra.", "Dr."'
                },
                dataDecisao: { 
                  type: 'string', 
                  description: 'Data da decisão no formato YYYY-MM-DD. Procure por "julgado em", "decidido em", data no cabeçalho. Converta datas em formato brasileiro (DD/MM/YYYY) para ISO.'
                },
                tribunal: { 
                  type: 'string', 
                  description: 'Sigla do tribunal: TJSP, TJMG, TJRJ, TRF1, TRF3, STJ, STF, TST, etc. Procure no cabeçalho ou rodapé.'
                },
                camaraTurma: { 
                  type: 'string', 
                  description: 'Câmara, Turma ou Vara julgadora (ex: "10ª CÂMARA CÍVEL", "3ª Turma", "7ª Vara Cível de Belo Horizonte"). Procure no cabeçalho.'
                },
                assunto: { 
                  type: 'string', 
                  description: 'Tema/assunto principal da decisão. Máximo 100 caracteres. Ex: "Plano de saúde - negativa de cobertura de exame", "INSS - auxílio-doença"'
                },
                tipoDecisao: { 
                  type: 'string', 
                  enum: ['Sentença', 'Acórdão', 'Decisão Monocrática (Efeito Suspensivo)'], 
                  description: 'Se menciona "acórdão" ou vem de câmara/turma = Acórdão. Se menciona "sentença" ou é 1ª instância = Sentença. Se "monocrática" = Decisão Monocrática (Efeito Suspensivo)'
                },
                resultado: { 
                  type: 'string', 
                  enum: ['Favorável', 'Parcialmente Favorável', 'Desfavorável'], 
                  description: 'Leia o DISPOSITIVO. "provimento" ou "procedente" = Favorável. "negaram provimento" ou "improcedente" = Desfavorável. "parcial" = Parcialmente Favorável'
                },
                poloCliente: { 
                  type: 'string', 
                  enum: ['Ativo', 'Passivo'], 
                  description: 'Se o cliente é autor/apelante = Ativo. Se é réu/apelado = Passivo. Verifique quem é o cliente na descrição do caso.'
                },
                valorDisputa: { 
                  type: 'number', 
                  description: 'Valor total em disputa/discussão em REAIS (apenas número, sem R$ ou pontos). Procure por "valor da causa", "valor em litígio". Ex: 50000.00'
                },
                economiaGerada: { 
                  type: 'number', 
                  description: 'Economia/benefício gerado para o cliente em REAIS (apenas número). Calcule baseado no resultado. Ex: 25000.00'
                },
                percentualExonerado: { 
                  type: 'number', 
                  description: 'Percentual exonerado/reduzido (0-100). Ex: se reduziu de 100% para 30%, percentualExonerado = 70'
                },
                montanteReconhecido: { 
                  type: 'number', 
                  description: 'Valor monetário reconhecido na decisão em REAIS (apenas número). Ex: 15000.00'
                },
                resumo: { 
                  type: 'string', 
                  description: 'Resumo estruturado da decisão contendo: 1) RELATÓRIO/CASO: explicação do caso, partes envolvidas e o que estava sendo discutido; 2) FUNDAMENTOS: principais argumentos e fundamentos jurídicos que motivaram a decisão; 3) DISPOSITIVO: decisão final (proveram, negaram, deram provimento parcial, etc.). Máximo 1000 caracteres.' 
                },
                normasLegaisCitadas: {
                  type: 'array',
                  description: 'Array com TODAS as normas legais citadas (leis, resoluções, decretos, etc.) organizadas por tipo',
                  items: {
                    type: 'object',
                    properties: {
                      tipo: { type: 'string', description: 'Tipo da norma: Lei, Resolução, Decreto, Portaria, Medida Provisória, etc.' },
                      nome: { type: 'string', description: 'Nome completo da norma (ex: Lei 8.213/91, Resolução CNJ 123/2015)' },
                      artigos: { 
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Lista de todos os artigos, parágrafos e incisos citados (ex: Art. 42, Art. 42, § 1º, Art. 43, III)'
                      }
                    }
                  }
                },
                doutrinasCitadas: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Array com citações COMPLETAS de doutrina. Cada item deve conter o bloco completo da citação como aparece no texto: referência bibliográfica (autor, obra, edição, editora, ano, página) + trecho citado (se houver). Copie LITERALMENTE sem modificar. Exemplo: "THEODORO JÚNIOR, Humberto. Curso de Direito Processual Civil. 59ª ed. Rio de Janeiro: Forense, 2018, p. 345: \'O princípio da instrumentalidade...\'"'
                },
                julgadosCitados: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Array com citações COMPLETAS de precedentes/julgados. Cada item deve conter o bloco completo: identificação (tribunal, número, turma, relator, data) + ementa completa + trechos do voto citados. Copie LITERALMENTE sem modificar. Exemplo: "STJ, REsp 1.234.567/SP, Rel. Min. Fulano, 3ª T., j. 15/03/2023. EMENTA: [...ementa completa...]. Trecho: \'[...trecho citado...]\'"'
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
