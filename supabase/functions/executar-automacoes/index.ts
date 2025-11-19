import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('[executar-automacoes] Iniciando execução de automações');

    // Busca automações ativas que precisam ser executadas
    const now = new Date().toISOString();
    const { data: automacoes, error: fetchError } = await supabase
      .from('automacoes_juridicas')
      .select('*')
      .eq('status', 'ativa')
      .or(`proxima_execucao.is.null,proxima_execucao.lte.${now}`);

    if (fetchError) {
      console.error('[executar-automacoes] Erro ao buscar automações:', fetchError);
      throw fetchError;
    }

    console.log(`[executar-automacoes] Encontradas ${automacoes?.length || 0} automações para executar`);

    const resultados = [];

    for (const automacao of automacoes || []) {
      const startTime = Date.now();
      
      try {
        console.log(`[executar-automacoes] Executando automação ${automacao.codigo_unico}`);

        let resultado: any = null;

        switch (automacao.tipo_automacao) {
          case 'consulta_cnj':
            resultado = await executarConsultaCNJ(supabase, automacao);
            break;
          case 'monitoramento_processo':
            resultado = await executarMonitoramentoProcesso(supabase, automacao);
            break;
          case 'verificacao_prazos':
            resultado = await executarVerificacaoPrazos(supabase, automacao);
            break;
          default:
            console.log(`[executar-automacoes] Tipo de automação desconhecido: ${automacao.tipo_automacao}`);
            continue;
        }

        const executionTime = Date.now() - startTime;

        // Registra execução bem-sucedida
        await supabase
          .from('execucoes_automacoes')
          .insert({
            automacao_id: automacao.id,
            status: 'sucesso',
            mensagem: 'Execução concluída com sucesso',
            dados_retorno: resultado,
            tempo_execucao_ms: executionTime,
          });

        // Atualiza próxima execução
        const proximaExecucao = calcularProximaExecucao(automacao.frequencia);
        await supabase
          .from('automacoes_juridicas')
          .update({
            ultima_execucao: now,
            proxima_execucao: proximaExecucao,
            total_execucoes: (automacao.total_execucoes || 0) + 1,
          })
          .eq('id', automacao.id);

        resultados.push({
          codigo: automacao.codigo_unico,
          status: 'sucesso',
          tempo: executionTime,
        });

      } catch (error) {
        console.error(`[executar-automacoes] Erro ao executar ${automacao.codigo_unico}:`, error);
        
        const executionTime = Date.now() - startTime;
        
        // Registra execução com erro
        await supabase
          .from('execucoes_automacoes')
          .insert({
            automacao_id: automacao.id,
            status: 'erro',
            mensagem: error instanceof Error ? error.message : 'Erro desconhecido',
            tempo_execucao_ms: executionTime,
          });

        // Atualiza status da automação para erro
        await supabase
          .from('automacoes_juridicas')
          .update({
            status: 'erro',
            ultima_execucao: now,
          })
          .eq('id', automacao.id);

        resultados.push({
          codigo: automacao.codigo_unico,
          status: 'erro',
          erro: error instanceof Error ? error.message : 'Erro desconhecido',
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        executadas: resultados.length,
        resultados,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[executar-automacoes] Erro geral:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function executarConsultaCNJ(supabase: any, automacao: any) {
  console.log('[executarConsultaCNJ] Iniciando consulta CNJ');
  
  const processosParaConsultar = automacao.parametros?.numeros_processo || [];
  
  if (processosParaConsultar.length === 0) {
    console.log('[executarConsultaCNJ] Nenhum processo configurado para consulta');
    return { processosConsultados: 0 };
  }

  const cnjApiKey = Deno.env.get('CNJ_API_KEY');
  if (!cnjApiKey) {
    throw new Error('CNJ_API_KEY não configurada');
  }

  let processosAtualizados = 0;

  for (const numeroProcesso of processosParaConsultar) {
    try {
      // Invoca a função buscar-processo-cnj
      const { data, error } = await supabase.functions.invoke('buscar-processo-cnj', {
        body: { numeroProcesso }
      });

      if (error) {
        console.error(`[executarConsultaCNJ] Erro ao consultar processo ${numeroProcesso}:`, error);
        continue;
      }

      if (data?.success) {
        processosAtualizados++;
        console.log(`[executarConsultaCNJ] Processo ${numeroProcesso} consultado com sucesso`);
      }
    } catch (error) {
      console.error(`[executarConsultaCNJ] Erro ao processar ${numeroProcesso}:`, error);
    }
  }

  return {
    processosConsultados: processosParaConsultar.length,
    processosAtualizados,
  };
}

async function executarMonitoramentoProcesso(supabase: any, automacao: any) {
  console.log('[executarMonitoramentoProcesso] Iniciando monitoramento');

  // Busca todos os processos monitorados ativos do usuário
  const { data: processos, error } = await supabase
    .from('processos_monitorados')
    .select('*')
    .eq('user_id', automacao.user_id)
    .eq('status', 'ativo');

  if (error) {
    console.error('[executarMonitoramentoProcesso] Erro ao buscar processos:', error);
    throw error;
  }

  console.log(`[executarMonitoramentoProcesso] Monitorando ${processos?.length || 0} processos`);

  let processosAtualizados = 0;
  let atualizacoesDetectadas = 0;

  for (const processo of processos || []) {
    try {
      // Consulta o processo no CNJ
      const { data, error: cnjError } = await supabase.functions.invoke('buscar-processo-cnj', {
        body: { numeroProcesso: processo.numero_processo }
      });

      if (cnjError || !data?.success) {
        console.log(`[executarMonitoramentoProcesso] Processo ${processo.numero_processo} não encontrado ou erro`);
        continue;
      }

      const dadosAtuais = data.data;
      
      // Verifica se houve mudança comparando com dados anteriores
      const houveMudanca = processo.dados_atuais 
        ? JSON.stringify(processo.dados_atuais) !== JSON.stringify(dadosAtuais)
        : true;

      if (houveMudanca) {
        atualizacoesDetectadas++;
        
        // Atualiza o registro do processo monitorado
        await supabase
          .from('processos_monitorados')
          .update({
            ultima_verificacao: new Date().toISOString(),
            ultima_atualizacao_detectada: new Date().toISOString(),
            dados_atuais: dadosAtuais,
            notificacoes_enviadas: (processo.notificacoes_enviadas || 0) + 1,
          })
          .eq('id', processo.id);

        console.log(`[executarMonitoramentoProcesso] Atualização detectada em ${processo.numero_processo}`);
      } else {
        // Atualiza apenas a data de verificação
        await supabase
          .from('processos_monitorados')
          .update({
            ultima_verificacao: new Date().toISOString(),
          })
          .eq('id', processo.id);
      }

      processosAtualizados++;

    } catch (error) {
      console.error(`[executarMonitoramentoProcesso] Erro ao monitorar ${processo.numero_processo}:`, error);
    }
  }

  return {
    processosMonitorados: processos?.length || 0,
    processosAtualizados,
    atualizacoesDetectadas,
  };
}

async function executarVerificacaoPrazos(supabase: any, automacao: any) {
  console.log('[executarVerificacaoPrazos] Iniciando verificação de prazos');

  // Busca pendências próximas do vencimento
  const hoje = new Date();
  const diasAlerta = automacao.parametros?.dias_alerta || 3;
  const dataLimite = new Date();
  dataLimite.setDate(dataLimite.getDate() + diasAlerta);

  const { data: pendencias, error } = await supabase
    .from('pendencias_urgencias')
    .select('*')
    .eq('user_id', automacao.user_id)
    .gte('prazo_limite', hoje.toISOString().split('T')[0])
    .lte('prazo_limite', dataLimite.toISOString().split('T')[0]);

  if (error) {
    console.error('[executarVerificacaoPrazos] Erro ao buscar pendências:', error);
    throw error;
  }

  console.log(`[executarVerificacaoPrazos] ${pendencias?.length || 0} pendências próximas do vencimento`);

  return {
    pendenciasProximasVencimento: pendencias?.length || 0,
    diasAlerta,
  };
}

function calcularProximaExecucao(frequencia: string): string {
  const agora = new Date();
  
  switch (frequencia) {
    case 'horaria':
      agora.setHours(agora.getHours() + 1);
      break;
    case 'diaria':
      agora.setDate(agora.getDate() + 1);
      break;
    case 'semanal':
      agora.setDate(agora.getDate() + 7);
      break;
    case 'mensal':
      agora.setMonth(agora.getMonth() + 1);
      break;
    default:
      agora.setDate(agora.getDate() + 1); // Default: diária
  }
  
  return agora.toISOString();
}
