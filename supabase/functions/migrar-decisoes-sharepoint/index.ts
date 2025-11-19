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
    console.log('Iniciando migração de decisões para SharePoint');

    const { limite = 10 } = await req.json();

    // Credenciais
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const clientId = Deno.env.get('MICROSOFT_CLIENT_ID');
    const clientSecret = Deno.env.get('MICROSOFT_CLIENT_SECRET');
    const driveId = Deno.env.get('SHAREPOINT_DRIVE_ID');

    if (!clientId || !clientSecret || !driveId) {
      throw new Error('Credenciais do Microsoft/SharePoint não configuradas');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Buscar decisões antigas sem SharePoint (que ainda usam o bucket)
    const { data: decisoesAntigas, error: queryError } = await supabase
      .from('decisoes_judiciais')
      .select('*')
      .is('sharepoint_item_id', null)
      .not('arquivo_url', 'is', null)
      .limit(limite);

    if (queryError) {
      throw new Error(`Erro ao buscar decisões antigas: ${queryError.message}`);
    }

    if (!decisoesAntigas || decisoesAntigas.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Nenhuma decisão para migrar',
          migradas: 0,
          erros: 0,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Encontradas ${decisoesAntigas.length} decisões para migrar`);

    // 2. Autenticar com Microsoft Graph
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

    // 3. Migrar cada decisão
    const resultados = {
      migradas: 0,
      erros: 0,
      detalhes: [] as any[],
    };

    for (const decisao of decisoesAntigas) {
      try {
        console.log(`Migrando decisão ${decisao.codigo_unico}...`);

        // Extrair o path do arquivo do URL do storage
        const urlParts = decisao.arquivo_url.split('/');
        const fileName = urlParts[urlParts.length - 1];

        // Baixar arquivo do bucket
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('decisoes-judiciais')
          .download(fileName);

        if (downloadError) {
          throw new Error(`Erro ao baixar arquivo: ${downloadError.message}`);
        }

        // Criar estrutura de pastas no SharePoint
        const ano = decisao.data_decisao 
          ? new Date(decisao.data_decisao).getFullYear()
          : new Date(decisao.data_criacao).getFullYear();
        const clienteNome = decisao.nome_cliente?.replace(/[^a-zA-Z0-9]/g, '_') || 'Cliente';
        const processoNum = decisao.numero_processo?.replace(/[^0-9]/g, '') || 'Processo';
        const folderPath = `Decisoes_Judiciais/${ano}/${clienteNome}/${processoNum}`;

        // Renomear arquivo
        const tipoDecisao = decisao.tipo_decisao?.replace(/\s+/g, '_') || 'Decisao';
        const dataFormatada = decisao.data_decisao 
          ? new Date(decisao.data_decisao).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0];
        const fileExtension = (decisao.arquivo_nome || fileName).split('.').pop();
        const novoNomeArquivo = `${tipoDecisao}_${processoNum}_${dataFormatada}.${fileExtension}`;

        // Upload para SharePoint
        const fileArrayBuffer = await fileData.arrayBuffer();
        const uploadUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/root:/${folderPath}/${novoNomeArquivo}:/content`;

        const uploadResponse = await fetch(uploadUrl, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${access_token}`,
            'Content-Type': 'application/pdf',
          },
          body: fileArrayBuffer,
        });

        if (!uploadResponse.ok) {
          const error = await uploadResponse.text();
          throw new Error(`Erro no upload SharePoint: ${error}`);
        }

        const uploadResult = await uploadResponse.json();

        // Atualizar registro no banco
        const { error: updateError } = await supabase
          .from('decisoes_judiciais')
          .update({
            arquivo_url: uploadResult.webUrl,
            arquivo_nome: novoNomeArquivo,
            sharepoint_drive_id: driveId,
            sharepoint_item_id: uploadResult.id,
          })
          .eq('id', decisao.id);

        if (updateError) {
          throw new Error(`Erro ao atualizar banco: ${updateError.message}`);
        }

        // Deletar arquivo do bucket
        const { error: deleteError } = await supabase.storage
          .from('decisoes-judiciais')
          .remove([fileName]);

        if (deleteError) {
          console.warn(`Aviso: Erro ao deletar arquivo do bucket: ${deleteError.message}`);
        }

        resultados.migradas++;
        resultados.detalhes.push({
          codigo: decisao.codigo_unico,
          status: 'success',
          sharepoint_url: uploadResult.webUrl,
        });

        console.log(`✓ Decisão ${decisao.codigo_unico} migrada com sucesso`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        console.error(`✗ Erro ao migrar decisão ${decisao.codigo_unico}:`, errorMessage);
        
        resultados.erros++;
        resultados.detalhes.push({
          codigo: decisao.codigo_unico,
          status: 'error',
          error: errorMessage,
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Migração concluída: ${resultados.migradas} sucesso, ${resultados.erros} erros`,
        migradas: resultados.migradas,
        erros: resultados.erros,
        detalhes: resultados.detalhes,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Erro na migração:', error);
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
