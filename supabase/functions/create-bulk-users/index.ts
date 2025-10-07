import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UserData {
  nome: string;
  email: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const { users } = await req.json() as { users: UserData[] };

    if (!users || !Array.isArray(users)) {
      throw new Error('Lista de usuários inválida');
    }

    const results = {
      created: [] as string[],
      errors: [] as { email: string; error: string }[],
    };

    for (const userData of users) {
      try {
        // Pular usuários sem email
        if (!userData.email || userData.email.trim() === '') {
          results.errors.push({
            email: userData.nome,
            error: 'Email não fornecido'
          });
          continue;
        }

        // Gerar senha temporária (combina nome + @CR2025)
        const tempPassword = `${userData.nome.split(' ')[0]}@CR2025`;

        // Criar usuário na autenticação
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: userData.email.trim(),
          password: tempPassword,
          email_confirm: true, // Auto-confirmar email
          user_metadata: {
            nome: userData.nome,
            perfil: 'advogado'
          }
        });

        if (authError) {
          results.errors.push({
            email: userData.email,
            error: authError.message
          });
          continue;
        }

        if (!authData.user) {
          results.errors.push({
            email: userData.email,
            error: 'Usuário não foi criado'
          });
          continue;
        }

        // Criar perfil
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .insert({
            id: authData.user.id,
            user_id: authData.user.id,
            nome: userData.nome,
            email: userData.email.trim(),
            perfil: 'advogado'
          });

        if (profileError) {
          console.error('Erro ao criar perfil:', profileError);
          // Continuar mesmo com erro no perfil
        }

        // Criar role
        const { error: roleError } = await supabaseAdmin
          .from('user_roles')
          .insert({
            user_id: authData.user.id,
            role: 'advogado'
          });

        if (roleError) {
          console.error('Erro ao criar role:', roleError);
          // Continuar mesmo com erro na role
        }

        results.created.push(userData.email);

      } catch (error) {
        results.errors.push({
          email: userData.email,
          error: error.message
        });
      }
    }

    return new Response(
      JSON.stringify(results),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});