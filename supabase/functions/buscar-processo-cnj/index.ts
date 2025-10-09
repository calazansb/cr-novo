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
    const { numeroProcesso } = await req.json();
    
    if (!numeroProcesso) {
      return new Response(
        JSON.stringify({ error: 'Número do processo é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Remove caracteres não numéricos
    const numeroLimpo = numeroProcesso.replace(/\D/g, '');
    
    // Determina o tribunal baseado no número do processo (segmento)
    const segmento = numeroLimpo.substring(13, 14);
    let tribunal = 'trf1'; // Default
    
    // Mapeia tribunais (simplificado - você pode expandir)
    const tribunalMap: Record<string, string> = {
      '1': 'trf1',
      '2': 'trf2',
      '3': 'trf3',
      '4': 'trf4',
      '5': 'trf5',
      '6': 'trf6',
    };
    
    tribunal = tribunalMap[segmento] || 'trf1';
    
    const apiKey = Deno.env.get('CNJ_API_KEY');
    
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'API Key do CNJ não configurada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Faz a requisição para a API do CNJ
    const response = await fetch(`https://api-publica.datajud.cnj.jus.br/api_publica_${tribunal}/_search`, {
      method: 'POST',
      headers: {
        'Authorization': `APIKey ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: {
          match: {
            numeroProcesso: numeroLimpo
          }
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Erro na API do CNJ: ${response.status}`);
    }

    const data = await response.json();
    
    // Extrai os dados relevantes
    if (data.hits && data.hits.hits && data.hits.hits.length > 0) {
      const processo = data.hits.hits[0]._source;
      
      // Extrai nomes das partes (polo ativo e passivo)
      const partesPoloAtivo = processo.poloAtivo?.map((p: any) => p.nome || '').filter(Boolean) || [];
      const partesPoloPassivo = processo.poloPassivo?.map((p: any) => p.nome || '').filter(Boolean) || [];
      const todasPartes = [...partesPoloAtivo, ...partesPoloPassivo];
      
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            numeroProcesso: processo.numeroProcesso,
            classe: processo.classe?.nome || '',
            assuntos: processo.assuntos?.map((a: any) => a.nome).join(', ') || '',
            orgaoJulgador: processo.orgaoJulgador?.nome || '',
            dataAjuizamento: processo.dataAjuizamento,
            tribunal: processo.tribunal,
            grau: processo.grau,
            movimentos: processo.movimentos || [],
            sistema: processo.sistema?.nome || '',
            formato: processo.formato?.nome || '',
            partesPoloAtivo,
            partesPoloPassivo,
            todasPartes
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Processo não encontrado'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Erro ao buscar processo:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});