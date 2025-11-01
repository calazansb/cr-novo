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

    // Chamar Lovable AI para análise do texto
    const promptAnalise = `Você é um especialista em análise de decisões judiciais brasileiras. 

Analise o seguinte texto de uma decisão judicial e extraia as seguintes informações em formato JSON:

1. numeroProcesso: Número do processo no formato CNJ
2. autor: Nome do autor da ação
3. reu: Nome do réu
4. relator: Nome do Juiz, Desembargador ou Ministro relator
5. dataDecisao: Data da decisão no formato YYYY-MM-DD
6. tribunal: Tribunal (ex: TJSP, TRF3, STJ, STF)
7. camaraTurma: Câmara ou Turma julgadora
8. assunto: Assunto/Tema principal (conciso, máximo 100 caracteres)
9. termosFrequentes: Array com os 10 termos jurídicos mais frequentes no formato [{"termo": "...", "frequencia": N}]
10. doutrinasCitadas: Array de objetos com as doutrinas citadas no formato [{"doutrinador": "...", "obra": "...", "trecho": "...", "fonte": "..."}]
11. julgadosCitados: Array de objetos com julgados citados no formato [{"numeroProcesso": "...", "tribunal": "...", "data": "...", "trecho": "...", "fonte": "..."}]
12. resumo: Resumo objetivo da decisão (máximo 500 caracteres)

IMPORTANTE: 
- Transcreva IPSIS LITTERIS os trechos de doutrinas e julgados citados
- Se alguma informação não estiver disponível, use null
- Retorne APENAS o JSON, sem texto adicional

Texto da decisão:
${fileText.substring(0, 15000)}`;

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
            content: 'Você é um assistente especializado em análise de documentos jurídicos brasileiros. Retorne sempre respostas em formato JSON válido.'
          },
          {
            role: 'user',
            content: promptAnalise
          }
        ],
        temperature: 0.3,
        max_tokens: 4000
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
    const aiContent = aiData.choices?.[0]?.message?.content;

    if (!aiContent) {
      throw new Error('Resposta vazia da IA');
    }

    console.log('Resposta da IA recebida');

    // Extrair JSON da resposta (caso venha com texto adicional)
    let dadosExtraidos;
    try {
      // Tentar parsear diretamente
      dadosExtraidos = JSON.parse(aiContent);
    } catch {
      // Tentar extrair JSON entre ```json e ```
      const jsonMatch = aiContent.match(/```json\s*([\s\S]*?)\s*```/) || 
                        aiContent.match(/```\s*([\s\S]*?)\s*```/) ||
                        aiContent.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        dadosExtraidos = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      } else {
        throw new Error('Não foi possível extrair JSON da resposta da IA');
      }
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
