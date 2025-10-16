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
    const MICROSOFT_CLIENT_ID = Deno.env.get('MICROSOFT_CLIENT_ID');
    const MICROSOFT_TENANT_ID = '15284730-6837-4e3e-83c2-2b07b60c6d5c'; // Calazans Rossi Advogados
    const redirectUri = 'https://dd7eb8dc-bd70-4c40-be56-99eed4439748.lovableproject.com/onedrive/callback';

    // Validação básica do CLIENT_ID (deve ser um GUID)
    const guidRegex = /^[0-9a-fA-F-]{36}$/;
    if (!MICROSOFT_CLIENT_ID || !guidRegex.test(MICROSOFT_CLIENT_ID)) {
      console.error('[onedrive-auth] MICROSOFT_CLIENT_ID inválido ou ausente:', MICROSOFT_CLIENT_ID);
      return new Response(
        JSON.stringify({ error: 'MICROSOFT_CLIENT_ID inválido. Esperado um GUID (Application ID).' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // URL de autorização do Microsoft OAuth com Tenant ID específico
    const authUrl = new URL(`https://login.microsoftonline.com/${MICROSOFT_TENANT_ID}/oauth2/v2.0/authorize`);
    authUrl.searchParams.append('client_id', MICROSOFT_CLIENT_ID);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('scope', 'User.Read offline_access Files.ReadWrite Files.ReadWrite.All');
    authUrl.searchParams.append('response_mode', 'query');

    console.log('[onedrive-auth] Gerando auth URL', { tenant: MICROSOFT_TENANT_ID, client_id: MICROSOFT_CLIENT_ID });

    return new Response(
      JSON.stringify({ authUrl: authUrl.toString() }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error('Erro ao gerar URL de autenticação:', error);
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
