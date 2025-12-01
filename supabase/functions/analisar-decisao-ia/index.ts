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

    const promptAnalise = `Você é um assistente especializado em análise de decisões judiciais brasileiras. 
Sua tarefa é extrair informações estruturadas de decisões judiciais com MÁXIMA PRECISÃO e CONFIANÇA.

INSTRUÇÕES CRÍTICAS:
1. Leia TODA a decisão cuidadosamente antes de extrair dados
2. Para cada campo extraído, avalie sua confiança (0.0 a 1.0)
3. Se um campo não for encontrado ou você não tiver certeza, retorne null e confiança baixa
4. Normalize valores monetários para números (ex: "R$ 1.234,56" → 1234.56)
5. Normalize datas para formato ISO (ex: "15/03/2024" → "2024-03-15")
6. Identifique padrões de nomes completos de magistrados (não apenas sobrenomes)
7. Extraia números de processo no formato CNJ quando possível
8. Para valores disputados e economia gerada, busque por termos como "valor da causa", "montante", "condenação", "economia"

EXEMPLOS DE EXTRAÇÃO:

Exemplo 1 - Acórdão com informações completas:
ENTRADA: "APELAÇÃO CÍVEL Nº 1234567-89.2023.8.26.0100. Relator: Des. João da Silva. Tribunal de Justiça de São Paulo. 10ª Câmara de Direito Público. Julgamento em 15/03/2024. Apelante: EMPRESA XYZ LTDA. Apelado: FAZENDA PÚBLICA DO ESTADO DE SÃO PAULO. Valor da causa: R$ 500.000,00. DECISÃO: Negaram provimento ao recurso. Mantida a condenação de R$ 200.000,00."

SAÍDA ESPERADA:
{
  "numeroProcesso": "1234567-89.2023.8.26.0100",
  "numeroProcessoConfianca": 1.0,
  "tipoDecisao": "Acórdão",
  "tipoDecisaoConfianca": 1.0,
  "tribunal": "Tribunal de Justiça de São Paulo",
  "tribunalConfianca": 1.0,
  "camaraTurma": "10ª Câmara de Direito Público",
  "camaraTurmaConfianca": 1.0,
  "relator": "Des. João da Silva",
  "relatorConfianca": 1.0,
  "dataDecisao": "2024-03-15",
  "dataDecisaoConfianca": 1.0,
  "autor": "EMPRESA XYZ LTDA",
  "autorConfianca": 0.95,
  "reu": "FAZENDA PÚBLICA DO ESTADO DE SÃO PAULO",
  "reuConfianca": 0.95,
  "poloCliente": "Ativo",
  "poloClienteConfianca": 0.9,
  "resultado": "Desfavorável",
  "resultadoConfianca": 0.95,
  "valorDisputa": 500000.00,
  "valorDisputaConfianca": 1.0,
  "economiaGerada": 0.00,
  "economiaGeradaConfianca": 0.8,
  "assunto": "Apelação Cível - Direito Público",
  "assuntoConfianca": 0.9,
  "resumo": "Recurso de apelação negado. Mantida condenação de R$ 200.000,00.",
  "resumoConfianca": 0.95
}

Exemplo 2 - Sentença parcial:
ENTRADA: "SENTENÇA - Processo 9876543-21.2023.5.02.0001. Juiz: Dr. Maria Santos. 1ª Vara do Trabalho de São Paulo. Reclamante: João Oliveira. Reclamada: CONSTRUTORA ABC S/A. Julgado em 20/05/2024. JULGO PARCIALMENTE PROCEDENTE o pedido para condenar a ré ao pagamento de R$ 50.000,00 a título de danos morais, de um total pedido de R$ 150.000,00."

SAÍDA ESPERADA:
{
  "numeroProcesso": "9876543-21.2023.5.02.0001",
  "numeroProcessoConfianca": 1.0,
  "tipoDecisao": "Sentença",
  "tipoDecisaoConfianca": 1.0,
  "tribunal": "Tribunal Regional do Trabalho da 2ª Região",
  "tribunalConfianca": 0.85,
  "camaraTurma": "1ª Vara do Trabalho de São Paulo",
  "camaraTurmaConfianca": 1.0,
  "relator": "Dr. Maria Santos",
  "relatorConfianca": 1.0,
  "dataDecisao": "2024-05-20",
  "dataDecisaoConfianca": 1.0,
  "autor": "João Oliveira",
  "autorConfianca": 1.0,
  "reu": "CONSTRUTORA ABC S/A",
  "reuConfianca": 1.0,
  "poloCliente": "Passivo",
  "poloClienteConfianca": 0.9,
  "resultado": "Parcialmente Favorável",
  "resultadoConfianca": 0.95,
  "valorDisputa": 150000.00,
  "valorDisputaConfianca": 0.9,
  "economiaGerada": 100000.00,
  "economiaGeradaConfianca": 0.85,
  "montanteReconhecido": 50000.00,
  "montanteReconhecidoConfianca": 1.0,
  "percentualExonerado": 66.67,
  "percentualExoneradoConfianca": 0.9,
  "assunto": "Danos Morais - Direito do Trabalho",
  "assuntoConfianca": 0.9,
  "resumo": "Sentença parcialmente procedente. Condenação de R$ 50.000,00 em danos morais, de um pedido inicial de R$ 150.000,00, gerando economia de R$ 100.000,00.",
  "resumoConfianca": 0.95
}

REGRAS DE NORMALIZAÇÃO:
- Tipo de Decisão: "Acórdão", "Sentença", "Decisão Monocrática (Efeito Suspensivo)", ou "Decisão Interlocutória"
- Resultado: "Favorável", "Parcialmente Favorável", "Desfavorável"
- Polo Cliente: "Ativo" (autor/apelante/recorrente) ou "Passivo" (réu/apelado/recorrido)
- Valores: sempre em número decimal (ex: 1234.56), nunca string com formatação
- Datas: sempre no formato "YYYY-MM-DD"
- Percentuais: número decimal de 0 a 100 (ex: 66.67 para 66,67%)

CÁLCULOS AUTOMÁTICOS:
- Se encontrar "valor pedido" e "valor condenado", calcule:
  * economiaGerada = valorPedido - valorCondenado (se cliente é réu/passivo)
  * percentualExonerado = (economiaGerada / valorPedido) * 100
- Se o cliente for autor e ganhou, economiaGerada = 0 (cliente recebeu, não economizou)

===== TEXTO DA DECISÃO =====
${(baseText || '').slice(0, 50000)}
===== FIM DO TEXTO =====

Agora extraia TODOS os campos com seus respectivos scores de confiança.`;

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
            description: 'Extrai dados de decisão judicial com scores de confiança',
            parameters: {
              type: 'object',
              properties: {
                numeroProcesso: { type: 'string' },
                numeroProcessoConfianca: { type: 'number', minimum: 0, maximum: 1 },
                autor: { type: 'string' },
                autorConfianca: { type: 'number', minimum: 0, maximum: 1 },
                reu: { type: 'string' },
                reuConfianca: { type: 'number', minimum: 0, maximum: 1 },
                adverso: { type: 'string' },
                adversoConfianca: { type: 'number', minimum: 0, maximum: 1 },
                relator: { type: 'string' },
                relatorConfianca: { type: 'number', minimum: 0, maximum: 1 },
                dataDecisao: { type: 'string' },
                dataDecisaoConfianca: { type: 'number', minimum: 0, maximum: 1 },
                tribunal: { type: 'string' },
                tribunalConfianca: { type: 'number', minimum: 0, maximum: 1 },
                camaraTurma: { type: 'string' },
                camaraTurmaConfianca: { type: 'number', minimum: 0, maximum: 1 },
                assunto: { type: 'string' },
                assuntoConfianca: { type: 'number', minimum: 0, maximum: 1 },
                tipoDecisao: { type: 'string', enum: ['Sentença', 'Acórdão', 'Decisão Monocrática (Efeito Suspensivo)', 'Decisão Interlocutória'] },
                tipoDecisaoConfianca: { type: 'number', minimum: 0, maximum: 1 },
                resultado: { type: 'string', enum: ['Favorável', 'Parcialmente Favorável', 'Desfavorável'] },
                resultadoConfianca: { type: 'number', minimum: 0, maximum: 1 },
                poloCliente: { type: 'string', enum: ['Ativo', 'Passivo'] },
                poloClienteConfianca: { type: 'number', minimum: 0, maximum: 1 },
                valorDisputa: { type: 'number' },
                valorDisputaConfianca: { type: 'number', minimum: 0, maximum: 1 },
                economiaGerada: { type: 'number' },
                economiaGeradaConfianca: { type: 'number', minimum: 0, maximum: 1 },
                percentualExonerado: { type: 'number' },
                percentualExoneradoConfianca: { type: 'number', minimum: 0, maximum: 1 },
                montanteReconhecido: { type: 'number' },
                montanteReconhecidoConfianca: { type: 'number', minimum: 0, maximum: 1 },
                resumo: { type: 'string' },
                resumoConfianca: { type: 'number', minimum: 0, maximum: 1 },
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
