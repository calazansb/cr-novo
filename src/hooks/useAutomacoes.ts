import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AutomacaoJuridica {
  id: string;
  codigo_unico: string;
  nome: string;
  descricao?: string;
  tipo_automacao: 'consulta_cnj' | 'monitoramento_processo' | 'verificacao_prazos';
  status: 'ativa' | 'pausada' | 'concluida' | 'erro';
  frequencia: 'diaria' | 'semanal' | 'mensal' | 'horaria';
  parametros?: any;
  proxima_execucao?: string;
  ultima_execucao?: string;
  total_execucoes: number;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface ProcessoMonitorado {
  id: string;
  numero_processo: string;
  cliente?: string;
  orgao?: string;
  ultima_verificacao?: string;
  ultima_atualizacao_detectada?: string;
  dados_atuais?: any;
  notificacoes_enviadas: number;
  status: 'ativo' | 'pausado' | 'arquivado';
  user_id: string;
  created_at: string;
  updated_at: string;
}

export const useAutomacoes = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchAutomacoes = async () => {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user) return [];

    const { data, error } = await supabase
      .from('automacoes_juridicas')
      .select('*')
      .eq('user_id', session.session.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar automações:', error);
      return [];
    }

    return data as AutomacaoJuridica[];
  };

  const createAutomacao = async (automacao: Partial<AutomacaoJuridica>) => {
    setLoading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase
        .from('automacoes_juridicas')
        .insert({
          ...automacao,
          user_id: session.session.user.id,
          codigo_unico: '', // Será gerado pelo trigger
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Automação criada!",
        description: `Código: ${data.codigo_unico}`,
      });

      return data;
    } catch (error) {
      console.error('Erro ao criar automação:', error);
      toast({
        title: "Erro ao criar automação",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateAutomacao = async (id: string, updates: Partial<AutomacaoJuridica>) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('automacoes_juridicas')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Automação atualizada!",
        description: "As alterações foram salvas com sucesso.",
      });

      return true;
    } catch (error) {
      console.error('Erro ao atualizar automação:', error);
      toast({
        title: "Erro ao atualizar automação",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteAutomacao = async (id: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('automacoes_juridicas')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Automação excluída!",
        description: "A automação foi removida com sucesso.",
      });

      return true;
    } catch (error) {
      console.error('Erro ao excluir automação:', error);
      toast({
        title: "Erro ao excluir automação",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const fetchProcessosMonitorados = async () => {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user) return [];

    const { data, error } = await supabase
      .from('processos_monitorados')
      .select('*')
      .eq('user_id', session.session.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar processos monitorados:', error);
      return [];
    }

    return data as ProcessoMonitorado[];
  };

  const addProcessoMonitorado = async (numeroProcesso: string, cliente?: string, orgao?: string) => {
    setLoading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase
        .from('processos_monitorados')
        .insert({
          numero_processo: numeroProcesso,
          cliente,
          orgao,
          user_id: session.session.user.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Processo adicionado ao monitoramento!",
        description: `Processo ${numeroProcesso} será verificado automaticamente.`,
      });

      return data;
    } catch (error) {
      console.error('Erro ao adicionar processo monitorado:', error);
      toast({
        title: "Erro ao adicionar processo",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateProcessoMonitorado = async (id: string, updates: Partial<ProcessoMonitorado>) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('processos_monitorados')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Status do processo atualizado!",
      });

      return true;
    } catch (error) {
      console.error('Erro ao atualizar processo monitorado:', error);
      toast({
        title: "Erro ao atualizar processo",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    fetchAutomacoes,
    createAutomacao,
    updateAutomacao,
    deleteAutomacao,
    fetchProcessosMonitorados,
    addProcessoMonitorado,
    updateProcessoMonitorado,
  };
};
