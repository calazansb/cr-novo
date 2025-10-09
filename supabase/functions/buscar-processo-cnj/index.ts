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
    
    // Determina segmento (J) e o código do tribunal (TR)
    const segmento = numeroLimpo.substring(13, 14);
    const trCode = numeroLimpo.substring(14, 16);

    // Mapas auxiliares
    const estadoMap: Record<string, string> = {
      '01': 'ac','02': 'al','03': 'am','04': 'ap','05': 'ba','06': 'ce','07': 'df','08': 'es','09': 'go','10': 'ma','11': 'mg','12': 'ms','13': 'mt','14': 'pa','15': 'pb','16': 'pe','17': 'pi','18': 'pr','19': 'rj','20': 'rn','21': 'ro','22': 'rr','23': 'rs','24': 'sc','25': 'se','26': 'sp','27': 'to',
    };

    function resolveEndpoint(segmento: string, tr: string): string {
      // Tribunais superiores
      if (segmento === '1') return 'stf';
      if (segmento === '2') return 'stj';
      if (segmento === '6') return 'stm';

      // Justiça Federal (TRF)
      if (segmento === '5') {
        const reg = String(parseInt(tr, 10)); // '01' -> '1'
        return `trf${reg}`;
      }

      // Justiça Estadual (TJ)
      if (segmento === '8') {
        const uf = estadoMap[tr];
        if (uf === 'df') return 'tjdft';
        return uf ? `tj${uf}` : 'tjsp';
      }

      // Justiça do Trabalho (TRT)
      if (segmento === '4') {
        const reg = String(parseInt(tr, 10));
        return `trt${reg}`;
      }

      // Justiça Eleitoral (TRE)
      if (segmento === '3') {
        const uf = estadoMap[tr];
        return uf ? `tre-${uf}` : 'tre-sp';
      }

      // Fallback: usa TJSP
      return 'tjsp';
    }

    const tribunal = resolveEndpoint(segmento, trCode);
    console.log('[buscar-processo-cnj] segmento:', segmento, 'tr:', trCode, 'endpoint:', tribunal);
    
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