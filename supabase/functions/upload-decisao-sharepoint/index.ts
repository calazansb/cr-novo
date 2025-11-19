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
    const { nomeCliente, numeroProcesso, ano } = metadata;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Criar estrutura de pastas: ANO/CLIENTE/PROCESSO/arquivo.pdf
    const sanitize = (str: string) => str.replace(/[<>:"/\\|?*]/g, '_').trim();
    
    const folderPath = `${ano}/${sanitize(nomeCliente)}/${sanitize(numeroProcesso)}`;
    const fileName = `decisao_${sanitize(numeroProcesso)}.pdf`;
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

    // Extrair texto do arquivo para análise de IA
    const texto = await extractTextFromFile(arrayBuffer, file.type);

    // Invocar função de análise de IA
    let analiseIA = null;
    try {
      const { data: analiseData, error: analiseError } = await supabase.functions.invoke('analisar-decisao-ia', {
        body: { 
          texto,
          nomeArquivo: fileName
        }
      });

      if (analiseError) {
        console.error('Erro na análise de IA:', analiseError);
      } else {
        analiseIA = analiseData;
        console.log('Análise de IA concluída com sucesso');
      }
    } catch (error) {
      console.error('Erro ao invocar análise de IA:', error);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        fileUrl: urlData.publicUrl,
        fileName: fileName,
        filePath: fullPath,
        analiseIA: analiseIA
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Erro na função upload-decisao:', error);
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

async function extractTextFromFile(arrayBuffer: ArrayBuffer, fileType: string): Promise<string> {
  const decoder = new TextDecoder('utf-8');
  
  if (fileType === 'application/pdf') {
    // Para PDFs, extrair texto básico
    const text = decoder.decode(arrayBuffer);
    const cleanText = text
      .replace(/[^\x20-\x7E\n]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    return cleanText.substring(0, 50000);
  } else if (fileType === 'text/plain' || fileType === 'text/html') {
    return decoder.decode(arrayBuffer).substring(0, 50000);
  }
  
  return 'Conteúdo do arquivo anexado para análise.';
}
