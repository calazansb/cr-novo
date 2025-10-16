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
    const url = new URL(req.url);

    // Suporte a POST (app -> função) e GET (Microsoft -> função)
    let code: string | null = null;
    if (req.method === 'POST') {
      try {
        const body = await req.json();
        code = body?.code ?? null;
        console.log('[onedrive-callback] Código recebido via POST?', { has_code: !!code });
      } catch (e) {
        console.warn('[onedrive-callback] Falha ao ler JSON do POST', e);
      }
    }
    if (!code) {
      code = url.searchParams.get('code');
    }

    if (!code) {
      throw new Error('Código de autorização não encontrado');
    }

    const MICROSOFT_CLIENT_ID = Deno.env.get('MICROSOFT_CLIENT_ID');
    const MICROSOFT_CLIENT_SECRET = Deno.env.get('MICROSOFT_CLIENT_SECRET');
    const MICROSOFT_TENANT_ID = '15284730-6837-4e3e-83c2-2b07b60c6d5c'; // Calazans Rossi Advogados
    const redirectUri = req.method === 'POST'
      ? 'https://dd7eb8dc-bd70-4c40-be56-99eed4439748.lovableproject.com/onedrive/callback'
      : 'https://szioctpwyczsdeeypnnv.supabase.co/functions/v1/onedrive-callback';

    console.log('[onedrive-callback] Iniciando troca de código por token', {
      tenant: MICROSOFT_TENANT_ID,
      client_id: MICROSOFT_CLIENT_ID,
      redirect_uri: redirectUri,
      has_code: !!code,
      has_client_secret: !!MICROSOFT_CLIENT_SECRET
    });

    // Trocar o código pelo token de acesso usando Tenant ID específico
    const tokenResponse = await fetch(`https://login.microsoftonline.com/${MICROSOFT_TENANT_ID}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: MICROSOFT_CLIENT_ID!,
        client_secret: MICROSOFT_CLIENT_SECRET!,
        code: code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    console.log('[onedrive-callback] Resposta do token endpoint', {
      status: tokenResponse.status,
      statusText: tokenResponse.statusText,
      ok: tokenResponse.ok
    });

    const tokenData = await tokenResponse.json();
    
    console.log('[onedrive-callback] Dados do token recebidos', {
      has_access_token: !!tokenData.access_token,
      has_refresh_token: !!tokenData.refresh_token,
      has_error: !!tokenData.error,
      error: tokenData.error,
      error_description: tokenData.error_description
    });

    if (tokenData.error) {
      console.error('[onedrive-callback] Erro da Microsoft:', {
        error: tokenData.error,
        description: tokenData.error_description,
        correlation_id: tokenData.correlation_id
      });
      throw new Error(tokenData.error_description || tokenData.error);
    }

    if (!tokenData.access_token) {
      console.error('[onedrive-callback] Token de acesso ausente na resposta');
      throw new Error('Token de acesso não recebido da Microsoft');
    }

    // Se veio via POST (invocado pelo app), retorne JSON com os tokens
    if (req.method === 'POST') {
      return new Response(
        JSON.stringify({
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fluxo antigo: redirecionar de volta para a aplicação com o access token
    const appUrl = 'https://dd7eb8dc-bd70-4c40-be56-99eed4439748.lovableproject.com';
    const redirectUrl = `${appUrl}?onedrive_token=${tokenData.access_token}&refresh_token=${tokenData.refresh_token}`;

    return new Response(null, {
      status: 302,
      headers: { 'Location': redirectUrl },
    });
  } catch (error) {
    console.error('Erro no callback OAuth:', error);
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
