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
    console.log('Obtendo link do SharePoint');

    // Credenciais do Microsoft
    const clientId = Deno.env.get('MICROSOFT_CLIENT_ID');
    const clientSecret = Deno.env.get('MICROSOFT_CLIENT_SECRET');
    const driveId = Deno.env.get('SHAREPOINT_DRIVE_ID');

    if (!clientId || !clientSecret || !driveId) {
      throw new Error('Credenciais do Microsoft/SharePoint não configuradas');
    }

    // Autenticar com Microsoft Graph
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

    // Obter informações do drive
    console.log('Obtendo informações do drive...');
    const driveResponse = await fetch(
      `https://graph.microsoft.com/v1.0/drives/${driveId}`,
      {
        headers: {
          'Authorization': `Bearer ${access_token}`,
        },
      }
    );

    if (!driveResponse.ok) {
      const error = await driveResponse.text();
      throw new Error(`Falha ao obter informações do drive: ${error}`);
    }

    const driveInfo = await driveResponse.json();
    console.log('Informações do drive obtidas:', driveInfo.webUrl);

    // Obter link da pasta Decisoes_Judiciais
    const folderResponse = await fetch(
      `https://graph.microsoft.com/v1.0/drives/${driveId}/root:/Decisoes_Judiciais`,
      {
        headers: {
          'Authorization': `Bearer ${access_token}`,
        },
      }
    );

    let decisoesFolderUrl = driveInfo.webUrl;
    if (folderResponse.ok) {
      const folderInfo = await folderResponse.json();
      decisoesFolderUrl = folderInfo.webUrl;
    }

    return new Response(
      JSON.stringify({
        success: true,
        driveUrl: driveInfo.webUrl,
        decisoesFolderUrl: decisoesFolderUrl,
        driveName: driveInfo.name,
        driveId: driveId,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Erro ao obter link do SharePoint:', error);
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
