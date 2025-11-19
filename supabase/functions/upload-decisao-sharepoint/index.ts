import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Iniciando upload de decisão para SharePoint');

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const metadados = JSON.parse(formData.get('metadados') as string);

    if (!file) {
      throw new Error('Arquivo não fornecido');
    }

    console.log('Arquivo recebido:', file.name, 'Tamanho:', file.size);
    console.log('Metadados:', metadados);

    // Credenciais do SharePoint e Microsoft
    const clientId = Deno.env.get('MICROSOFT_CLIENT_ID');
    const clientSecret = Deno.env.get('MICROSOFT_CLIENT_SECRET');
    const driveId = Deno.env.get('SHAREPOINT_DRIVE_ID');

    if (!clientId || !clientSecret || !driveId) {
      throw new Error('Credenciais do Microsoft/SharePoint não configuradas');
    }

    // 1. Autenticar com Microsoft Graph
    console.log('Autenticando com Microsoft Graph...');
    const tokenResponse = await fetch(
      'https://login.microsoftonline.com/common/oauth2/v2.0/token',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          scope: 'https://graph.microsoft.com/.default',
          grant_type: 'client_credentials',
        }),
      }
    );

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      throw new Error(`Falha na autenticação Microsoft: ${error}`);
    }

    const { access_token } = await tokenResponse.json();
    console.log('Autenticação bem-sucedida');

    // 2. Criar estrutura de pastas no SharePoint
    const clienteNome = metadados.nome_cliente?.replace(/[^a-zA-Z0-9]/g, '_') || 'Cliente';
    const processoNum = metadados.numero_processo?.replace(/[^0-9]/g, '') || 'Processo';
    const ano = new Date().getFullYear();
    
    const folderPath = `Decisoes_Judiciais/${ano}/${clienteNome}/${processoNum}`;
    console.log('Criando estrutura de pastas:', folderPath);

    // 3. Renomear arquivo com padrão
    const dataAtual = new Date().toISOString().split('T')[0];
    const tipoDecisao = metadados.tipo_decisao?.replace(/\s+/g, '_') || 'Decisao';
    const fileExtension = file.name.split('.').pop();
    const novoNomeArquivo = `${tipoDecisao}_${processoNum}_${dataAtual}.${fileExtension}`;
    
    console.log('Novo nome do arquivo:', novoNomeArquivo);

    // 4. Upload do arquivo para SharePoint
    const fileArrayBuffer = await file.arrayBuffer();
    const uploadUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/root:/${folderPath}/${novoNomeArquivo}:/content`;
    
    console.log('Fazendo upload para SharePoint...');
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': file.type || 'application/pdf',
      },
      body: fileArrayBuffer,
    });

    if (!uploadResponse.ok) {
      const error = await uploadResponse.text();
      throw new Error(`Falha no upload para SharePoint: ${error}`);
    }

    const uploadResult = await uploadResponse.json();
    console.log('Upload para SharePoint concluído:', uploadResult.id);

    // 5. Extrair texto do arquivo para análise de IA
    console.log('Extraindo texto do arquivo...');
    let textoExtraido = '';
    
    try {
      if (file.type === 'application/pdf') {
        // Para PDFs, usar biblioteca de extração
        const pdfText = await extractTextFromPDF(fileArrayBuffer);
        textoExtraido = pdfText;
      } else {
        // Para arquivos de texto
        const decoder = new TextDecoder('utf-8');
        textoExtraido = decoder.decode(fileArrayBuffer);
      }
      console.log('Texto extraído com sucesso, tamanho:', textoExtraido.length);
    } catch (error) {
      console.error('Erro ao extrair texto:', error);
      textoExtraido = 'Erro ao extrair texto do documento';
    }

    // 6. Chamar IA para análise (Gemini)
    console.log('Iniciando análise com IA...');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const { data: aiAnalysis, error: aiError } = await createClient(
      supabaseUrl,
      supabaseKey
    ).functions.invoke('analisar-decisao-ia', {
      body: {
        texto: textoExtraido,
        nomeArquivo: novoNomeArquivo,
      },
    });

    if (aiError) {
      console.error('Erro na análise de IA:', aiError);
    }

    console.log('Análise de IA concluída');

    // 7. Retornar resultado
    return new Response(
      JSON.stringify({
        success: true,
        sharepoint: {
          fileId: uploadResult.id,
          driveId: driveId,
          webUrl: uploadResult.webUrl,
          fileName: novoNomeArquivo,
          filePath: folderPath,
        },
        analise: aiAnalysis || null,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Erro no upload para SharePoint:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

// Função auxiliar para extrair texto de PDF
async function extractTextFromPDF(arrayBuffer: ArrayBuffer): Promise<string> {
  try {
    // Implementação básica - em produção, usar biblioteca como pdf-parse
    // Por enquanto, retornar indicação de que é um PDF
    const decoder = new TextDecoder('utf-8');
    const text = decoder.decode(arrayBuffer);
    
    // Tentar extrair algum texto visível
    const cleanText = text.replace(/[^\x20-\x7E\n]/g, '').trim();
    
    if (cleanText.length > 100) {
      return cleanText;
    }
    
    return 'Documento PDF - análise de conteúdo limitada. Verifique o arquivo no SharePoint.';
  } catch (error) {
    console.error('Erro ao extrair texto do PDF:', error);
    return 'Erro ao processar PDF';
  }
}
