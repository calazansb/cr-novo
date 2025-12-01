import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";

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

    console.log('[buscar-processo-cnj] Buscando processo:', numeroProcesso);

    // Fazer busca no PJe Comunica
    const searchUrl = 'https://comunica.pje.jus.br/consulta';
    
    // Primeira requisição: obter página inicial para cookies/tokens
    const initialResponse = await fetch(searchUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      }
    });

    const cookies = initialResponse.headers.get('set-cookie') || '';

    // Segunda requisição: fazer busca com o número do processo
    const formData = new URLSearchParams();
    formData.append('numeroProcesso', numeroProcesso);

    const searchResponse = await fetch(searchUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Cookie': cookies,
      },
      body: formData.toString()
    });

    if (!searchResponse.ok) {
      throw new Error(`Erro na busca PJe: ${searchResponse.status}`);
    }

    const html = await searchResponse.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');

    if (!doc) {
      throw new Error('Não foi possível processar a resposta HTML');
    }

    // Extrair dados do HTML
    const extractText = (selector: string): string => {
      const element = doc.querySelector(selector);
      return element?.textContent?.trim() || '';
    };

    const extractAllText = (selector: string): string[] => {
      const elements = doc.querySelectorAll(selector);
      return Array.from(elements).map(el => el.textContent?.trim() || '').filter(Boolean);
    };

    // Tentar extrair informações da página de resultados
    const numeroEncontrado = extractText('.numero-processo, .processo-numero, [data-label="Número"]');
    
    if (!numeroEncontrado) {
      console.log('[buscar-processo-cnj] Processo não encontrado no PJe');
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Processo não encontrado no sistema PJe'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extrair informações disponíveis
    const classe = extractText('.classe, [data-label="Classe"]');
    const assunto = extractText('.assunto, [data-label="Assunto"]');
    const orgaoJulgador = extractText('.orgao-julgador, .vara, [data-label="Órgão Julgador"], [data-label="Vara"]');
    const dataAjuizamento = extractText('.data-ajuizamento, [data-label="Data de Ajuizamento"]');
    const tribunal = extractText('.tribunal, [data-label="Tribunal"]');
    
    // Extrair partes (autor e réu)
    const partesAtivo = extractAllText('.parte-ativo, .autor, [data-label="Parte Ativa"], [data-label="Autor"]');
    const partesPassivo = extractAllText('.parte-passivo, .reu, [data-label="Parte Passiva"], [data-label="Réu"]');
    const todasPartes = [...partesAtivo, ...partesPassivo];

    // Extrair movimentos se disponíveis
    const movimentosElements = doc.querySelectorAll('.movimento, .andamento, [data-movimento]');
    const movimentos = Array.from(movimentosElements).map(el => {
      const dataEl = (el as any).querySelector?.('.data-movimento, .data');
      const descEl = (el as any).querySelector?.('.descricao-movimento, .texto');
      return {
        data: dataEl?.textContent?.trim() || '',
        descricao: descEl?.textContent?.trim() || ''
      };
    });

    console.log('[buscar-processo-cnj] Dados extraídos:', {
      numeroProcesso: numeroEncontrado,
      classe,
      assunto,
      orgaoJulgador,
      partesAtivo,
      partesPassivo
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          numeroProcesso: numeroEncontrado || numeroProcesso,
          classe: classe || '',
          assuntos: assunto || '',
          orgaoJulgador: orgaoJulgador || '',
          dataAjuizamento: dataAjuizamento || '',
          tribunal: tribunal || '',
          grau: '',
          movimentos: movimentos,
          sistema: 'PJe',
          formato: '',
          partesPoloAtivo: partesAtivo,
          partesPoloPassivo: partesPassivo,
          todasPartes
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[buscar-processo-cnj] Erro:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorMessage 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});