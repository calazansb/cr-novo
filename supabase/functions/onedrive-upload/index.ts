import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { accessToken, fileName, fileContent, folderPath } = await req.json();

    if (!accessToken || !fileName || !fileContent) {
      throw new Error('Parâmetros faltando: accessToken, fileName ou fileContent');
    }

    // Converter base64 para array buffer
    const base64Data = fileContent.split(',')[1] || fileContent;
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Caminho da pasta no OneDrive
    const folder = folderPath || 'Sistema CRA/Anexos';
    const uploadUrl = `https://graph.microsoft.com/v1.0/me/drive/root:/${folder}/${fileName}:/content`;

    console.log('Fazendo upload para OneDrive:', uploadUrl);

    // Fazer upload para OneDrive
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/octet-stream',
      },
      body: bytes,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('Erro no upload:', errorText);
      throw new Error(`Erro no upload: ${uploadResponse.status} - ${errorText}`);
    }

    const uploadData = await uploadResponse.json();

    console.log('Upload concluído com sucesso:', uploadData);

    return new Response(
      JSON.stringify({
        success: true,
        file: {
          id: uploadData.id,
          name: uploadData.name,
          webUrl: uploadData.webUrl,
          size: uploadData.size,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Erro ao fazer upload para OneDrive:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
