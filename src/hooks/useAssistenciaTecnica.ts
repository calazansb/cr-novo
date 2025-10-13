import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AssistenciaTecnica {
  id: string;
  codigo_unico: string;
  nome_solicitante: string;
  solicitacao_problema: string;
  nivel_urgencia: string;
  status: string;
  observacoes?: string;
  user_id?: string;
  created_at: string;
  updated_at: string;
}

export interface NovaAssistencia {
  nome_solicitante: string;
  solicitacao_problema: string;
  nivel_urgencia: string;
}

export const useAssistenciaTecnica = () => {
  const [assistencias, setAssistencias] = useState<AssistenciaTecnica[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const carregarAssistencias = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('assistencia_tecnica')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAssistencias(data || []);
    } catch (error) {
      console.error('Erro ao carregar assistências:', error);
      toast({
        title: "Erro ao carregar assistências",
        description: "Não foi possível carregar as assistências.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const criarAssistencia = async (dados: NovaAssistencia) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const insertData: any = {
        nome_solicitante: dados.nome_solicitante,
        solicitacao_problema: dados.solicitacao_problema,
        nivel_urgencia: dados.nivel_urgencia
      };

      const { data, error } = await supabase
        .from('assistencia_tecnica')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Assistência registrada!",
        description: `Protocolo: ${data.codigo_unico}`,
      });

      await carregarAssistencias();
      return data;
    } catch (error) {
      console.error('Erro ao criar assistência:', error);
      toast({
        title: "Erro ao registrar assistência",
        description: "Não foi possível registrar a assistência.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const atualizarAssistencia = async (id: string, dados: Partial<NovaAssistencia>) => {
    try {
      const { error } = await supabase
        .from('assistencia_tecnica')
        .update(dados)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Assistência atualizada",
        description: "A assistência foi atualizada com sucesso.",
      });

      await carregarAssistencias();
    } catch (error) {
      console.error('Erro ao atualizar assistência:', error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar a assistência.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const atualizarStatus = async (id: string, status: string, observacoes?: string) => {
    try {
      const updateData: any = { status };
      if (observacoes) {
        updateData.observacoes = observacoes;
      }

      const { error } = await supabase
        .from('assistencia_tecnica')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Status atualizado",
        description: "O status foi atualizado com sucesso.",
      });

      await carregarAssistencias();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: "Erro ao atualizar status",
        description: "Não foi possível atualizar o status.",
        variant: "destructive",
      });
    }
  };

  const deletarAssistencia = async (id: string) => {
    try {
      const { error } = await supabase
        .from('assistencia_tecnica')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Assistência excluída",
        description: "A assistência foi excluída com sucesso.",
      });

      await carregarAssistencias();
    } catch (error) {
      console.error('Erro ao deletar assistência:', error);
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir a assistência.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (supabase) {
      carregarAssistencias();
    }
  }, []);

  return {
    assistencias,
    loading,
    criarAssistencia,
    atualizarAssistencia,
    atualizarStatus,
    deletarAssistencia,
    carregarAssistencias
  };
};
