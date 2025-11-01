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
    const { decisaoId, filePath, fileName, metadados } = await req.json();
    
    if (!decisaoId || !filePath || !fileName || !metadados) {
      throw new Error('Parâmetros obrigatórios faltando');
    }

    const microsoftClientId = Deno.env.get('MICROSOFT_CLIENT_ID');
    const microsoftClientSecret = Deno.env.get('MICROSOFT_CLIENT_SECRET');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    if (!microsoftClientId || !microsoftClientSecret) {
      throw new Error('Credenciais do Microsoft Graph não configuradas');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Obter access token do Microsoft Graph
    const tokenResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: microsoftClientId,
        client_secret: microsoftClientSecret,
        scope: 'https://graph.microsoft.com/.default',
        grant_type: 'client_credentials'
      })
    });

    if (!tokenResponse.ok) {
      throw new Error('Falha ao autenticar no Microsoft Graph');
    }

    const { access_token } = await tokenResponse.json();

    // 2. Baixar arquivo do Supabase Storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('decisoes-judiciais')
      .download(filePath);

    if (downloadError) {
      throw new Error(`Erro ao baixar arquivo: ${downloadError.message}`);
    }

    // 3. Criar estrutura de pastas dinâmica no SharePoint
    // Hierarquia: Tema/Assunto -> Tribunal -> Câmara/Turma -> Ano
    const { tema, tribunal, camaraTurma, ano } = metadados;
    
    // Sanitizar nomes de pastas (remover caracteres inválidos)
    const sanitize = (str: string) => str.replace(/[<>:"/\\|?*]/g, '_');
    
    const folderPath = `Banco de Jurisprudências/${sanitize(tema)}/${sanitize(tribunal)}/${sanitize(camaraTurma)}/${ano}`;
    
    // Criar pastas (Microsoft Graph cria automaticamente se não existir)
    const driveId = 'YOUR_DRIVE_ID'; // Deve ser configurado
    const createFolderUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/root:/${encodeURIComponent(folderPath)}:/children`;

    // 4. Renomear arquivo conforme padrão: [Número CNJ] - [Relator].pdf
    const { numeroProcesso, relator } = metadados;
    const newFileName = `${sanitize(numeroProcesso)} - ${sanitize(relator)}.pdf`;

    // 5. Upload do arquivo para o SharePoint
    const arrayBuffer = await fileData.arrayBuffer();
    
    const uploadUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/root:/${encodeURIComponent(folderPath)}/${encodeURIComponent(newFileName)}:/content`;
    
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/pdf'
      },
      body: arrayBuffer
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('Erro no upload:', errorText);
      throw new Error('Falha ao fazer upload para SharePoint');
    }

    const uploadData = await uploadResponse.json();

    // 6. Atualizar decisão com informações do SharePoint
    const { error: updateError } = await supabase
      .from('decisoes_judiciais')
      .update({
        arquivo_url: uploadData.webUrl,
        arquivo_nome: newFileName,
        sharepoint_drive_id: uploadData.parentReference.driveId,
        sharepoint_item_id: uploadData.id
      })
      .eq('id', decisaoId);

    if (updateError) {
      console.error('Erro ao atualizar decisão:', updateError);
    }

    console.log('Arquivo arquivado com sucesso no SharePoint:', uploadData.webUrl);

    return new Response(
      JSON.stringify({ 
        success: true,
        sharePointUrl: uploadData.webUrl,
        driveId: uploadData.parentReference.driveId,
        itemId: uploadData.id
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Erro na função arquivar-sharepoint:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
