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
    const redirectUri = 'https://szioctpwyczsdeeypnnv.supabase.co/functions/v1/onedrive-callback';

    // URL de autorização do Microsoft OAuth com Tenant ID específico
    const authUrl = new URL(`https://login.microsoftonline.com/${MICROSOFT_TENANT_ID}/oauth2/v2.0/authorize`);
    authUrl.searchParams.append('client_id', MICROSOFT_CLIENT_ID!);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('scope', 'Files.ReadWrite Files.ReadWrite.All offline_access');
    authUrl.searchParams.append('response_mode', 'query');

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
