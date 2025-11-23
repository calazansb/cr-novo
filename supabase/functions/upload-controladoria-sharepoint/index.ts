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
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const metadataStr = formData.get('metadata') as string;
    
    if (!file || !metadataStr) {
      throw new Error('Arquivo e metadados são obrigatórios');
    }

    const metadata = JSON.parse(metadataStr);
    const { 
      codigoProtocolo,
      nomeCliente, 
      numeroProcesso, 
      dataCriacao,
      iniciaisAdvogado,
      mes,
      ano
    } = metadata;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Criar estrutura de pastas: Controladoria/ANO/MÊS/CLIENTE/arquivo.pdf
    const sanitize = (str: string) => str.replace(/[<>:"/\\|?*]/g, '_').trim();
    
    const folderPath = `Controladoria/${ano}/${mes}/${sanitize(nomeCliente)}`;
    
    // Nomenclatura: Cliente_NumeroProcesso_DataCriacao_IniciaisAdvogado
    const dataFormatada = dataCriacao.replace(/\//g, '-');
    const fileName = `${sanitize(nomeCliente)}_${sanitize(numeroProcesso)}_${dataFormatada}_${iniciaisAdvogado}.pdf`;
    const fullPath = `${folderPath}/${fileName}`;

    console.log('Fazendo upload para:', fullPath);

    // Upload do arquivo para Supabase Storage
    const arrayBuffer = await file.arrayBuffer();
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('decisoes-judiciais')
      .upload(fullPath, arrayBuffer, {
        contentType: file.type || 'application/pdf',
        upsert: true
      });

    if (uploadError) {
      console.error('Erro no upload:', uploadError);
      throw new Error(`Falha ao fazer upload: ${uploadError.message}`);
    }

    console.log('Upload bem-sucedido:', uploadData.path);

    // Gerar URL pública do arquivo
    const { data: urlData } = supabase.storage
      .from('decisoes-judiciais')
      .getPublicUrl(fullPath);

    return new Response(
      JSON.stringify({ 
        success: true,
        fileUrl: urlData.publicUrl,
        fileName: fileName,
        filePath: fullPath
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Erro na função upload-controladoria:', error);
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
