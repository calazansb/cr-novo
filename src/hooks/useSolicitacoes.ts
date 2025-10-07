import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { toast } from 'sonner';

// Tipos para compatibilidade
export type SolicitacaoControladoria = Database['public']['Tables']['solicitacoes_controladoria']['Row'];
export type NovasolicitacaoControladoria = {
  nome_solicitante: string;
  numero_processo?: string;
  cliente: string;
  objeto_solicitacao: string;
  descricao_detalhada: string;
  user_id: string;
};

export const useSolicitacoes = () => {
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoControladoria[]>([]);
  const [loading, setLoading] = useState(false);

  const carregarSolicitacoes = async () => {
    console.log('🔍 Tentando carregar solicitações...');
    console.log('🔧 Supabase configurado:', !!supabase);
    
    if (!supabase) {
      console.log('❌ Supabase não configurado');
      toast.error('Supabase não configurado');
      return;
    }
    setLoading(true);
    try {
      console.log('📡 Fazendo consulta ao Supabase...');
      const { data, error } = await supabase
        .from('solicitacoes_controladoria')
        .select('*')
        .order('data_criacao', { ascending: false });

      console.log('📊 Resultado da consulta:', { data, error });
      
      if (error) throw error;
      setSolicitacoes(data || []);
      console.log('✅ Solicitações carregadas:', data?.length || 0);
    } catch (error) {
      console.error('❌ Erro ao carregar solicitações:', error);
      toast.error('Erro ao carregar solicitações');
    } finally {
      setLoading(false);
    }
  };

  const criarSolicitacao = async (dados: NovasolicitacaoControladoria): Promise<string | null> => {
    console.log('🚀 Tentando criar solicitação:', dados);
    console.log('🔧 Supabase configurado:', !!supabase);
    
    if (!supabase) {
      console.log('❌ Supabase não configurado, pulando salvamento');
      toast('Supabase não configurado — a solicitação será enviada sem registro no dashboard.');
      return null;
    }
    try {
      console.log('💾 Inserindo no banco...');
      const { data, error } = await supabase
        .from('solicitacoes_controladoria')
        .insert(dados as any)
        .select('codigo_unico')
        .single();

      console.log('📊 Resultado da inserção:', { data, error });

      if (error) throw error;
      
      console.log('✅ Solicitação criada com código:', data.codigo_unico);
      toast.success(`Solicitação criada com código: ${data.codigo_unico}`);
      await carregarSolicitacoes(); // Recarrega a lista
      return data.codigo_unico;
    } catch (error: any) {
      console.error('❌ Erro ao criar solicitação:', error);
      const msg = (error?.message || '').toString();
      if (msg.includes('relation') || msg.includes('does not exist') || msg.includes('404')) {
        toast.error('Tabela solicitacoes_controladoria não existe no Supabase. Posso criá-la para você pela integração.');
      } else {
        toast.error('Erro ao criar solicitação');
      }
      return null;
    }
  };

  const atualizarStatus = async (id: string, status: SolicitacaoControladoria['status'], observacoes?: string) => {
    if (!supabase) {
      toast.error('Supabase não configurado');
      return;
    }
    try {
      const updateData: any = { status };
      if (observacoes !== undefined) {
        updateData.observacoes = observacoes;
      }

      const { error } = await supabase
        .from('solicitacoes_controladoria')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Status atualizado com sucesso');
      await carregarSolicitacoes();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  const deletarSolicitacao = async (id: string) => {
    if (!supabase) {
      toast.error('Supabase não configurado');
      return;
    }
    try {
      const { error } = await supabase
        .from('solicitacoes_controladoria')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Solicitação excluída com sucesso');
      await carregarSolicitacoes();
    } catch (error) {
      console.error('Erro ao excluir solicitação:', error);
      toast.error('Erro ao excluir solicitação');
    }
  };

  const exportarParaCSV = () => {
    const csv = [
      ['Código', 'Solicitante', 'Cliente', 'Objeto', 'Status', 'Data Criação'],
      ...solicitacoes.map(s => [
        s.codigo_unico,
        s.nome_solicitante,
        s.cliente,
        s.objeto_solicitacao,
        s.status,
        new Date(s.data_criacao).toLocaleDateString('pt-BR')
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `solicitacoes_controladoria_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  useEffect(() => {
    // Só tentar carregar se o Supabase estiver configurado
    if (supabase) {
      carregarSolicitacoes();
    } else {
      console.log('⚠️ Supabase não configurado, pulando carregamento inicial');
    }
  }, []);

  return {
    solicitacoes,
    loading,
    carregarSolicitacoes,
    criarSolicitacao,
    atualizarStatus,
    deletarSolicitacao,
    exportarParaCSV
  };
};

export const zerarSolicitacoes = async (): Promise<boolean> => {
  try {
    if (!supabase) {
      console.warn('Supabase não configurado para zerar.');
      return false;
    }
    const { error } = await supabase
      .from('solicitacoes_controladoria')
      .delete()
      .neq('id', '');
    if (error) throw error;
    console.log('🧹 Tabela solicitacoes_controladoria zerada com sucesso.');
    return true;
  } catch (err) {
    console.error('Erro ao zerar solicitações:', err);
    return false;
  }
};