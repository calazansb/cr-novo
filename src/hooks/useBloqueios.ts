import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Bloqueio {
  id: string;
  codigo_unico: string;
  numero_processo: string;
  orgao: string;
  tipo_bloqueio: string;
  valor_bloqueado?: number;
  data_bloqueio: string;
  instituicao_financeira?: string;
  agencia?: string;
  conta?: string;
  responsavel: string;
  cliente: string;
  descricao: string;
  observacoes?: string;
  user_id?: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    nome: string;
  };
}

export interface NovoBloqueio {
  numero_processo: string;
  orgao: string;
  tipo_bloqueio: string;
  valor_bloqueado?: number;
  data_bloqueio: string;
  instituicao_financeira?: string;
  agencia?: string;
  conta?: string;
  responsavel: string;
  cliente: string;
  descricao: string;
  observacoes?: string;
}

export const useBloqueios = () => {
  const [bloqueios, setBloqueios] = useState<Bloqueio[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const carregarBloqueios = async () => {
    try {
      setLoading(true);
      
      const { data: bloqueiosData, error: bloqueiosError } = await supabase
        .from('bloqueios_judiciais')
        .select('*')
        .order('created_at', { ascending: false });

      if (bloqueiosError) throw bloqueiosError;

      const userIds = [...new Set(bloqueiosData?.map(b => b.user_id).filter(Boolean))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, nome')
        .in('id', userIds);

      const bloqueiosComPerfis = bloqueiosData?.map(bloqueio => ({
        ...bloqueio,
        profiles: profilesData?.find(p => p.id === bloqueio.user_id)
      })) || [];

      setBloqueios(bloqueiosComPerfis);
    } catch (error) {
      console.error('Erro ao carregar bloqueios:', error);
      toast({
        title: "Erro ao carregar bloqueios",
        description: "Não foi possível carregar os bloqueios judiciais.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const criarBloqueio = async (dados: NovoBloqueio) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase
        .from('bloqueios_judiciais')
        .insert({
          numero_processo: dados.numero_processo,
          orgao: dados.orgao,
          tipo_bloqueio: dados.tipo_bloqueio,
          valor_bloqueado: dados.valor_bloqueado,
          data_bloqueio: dados.data_bloqueio,
          instituicao_financeira: dados.instituicao_financeira,
          agencia: dados.agencia,
          conta: dados.conta,
          responsavel: dados.responsavel,
          cliente: dados.cliente,
          descricao: dados.descricao,
          observacoes: dados.observacoes || '',
          user_id: user.id
        } as any)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Bloqueio registrado!",
        description: `Protocolo: ${data.codigo_unico}`,
      });

      await carregarBloqueios();
      return data;
    } catch (error) {
      console.error('Erro ao criar bloqueio:', error);
      toast({
        title: "Erro ao registrar bloqueio",
        description: "Não foi possível registrar o bloqueio judicial.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deletarBloqueio = async (id: string) => {
    try {
      const { error } = await supabase
        .from('bloqueios_judiciais')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Bloqueio excluído",
        description: "O bloqueio judicial foi excluído com sucesso.",
      });

      await carregarBloqueios();
    } catch (error) {
      console.error('Erro ao deletar bloqueio:', error);
      toast({
        title: "Erro ao excluir bloqueio",
        description: "Não foi possível excluir o bloqueio judicial.",
        variant: "destructive",
      });
    }
  };

  const atualizarBloqueio = async (id: string, dados: Partial<NovoBloqueio>) => {
    try {
      const { error } = await supabase
        .from('bloqueios_judiciais')
        .update(dados)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Bloqueio atualizado",
        description: "O bloqueio judicial foi atualizado com sucesso.",
      });

      await carregarBloqueios();
    } catch (error) {
      console.error('Erro ao atualizar bloqueio:', error);
      toast({
        title: "Erro ao atualizar bloqueio",
        description: "Não foi possível atualizar o bloqueio judicial.",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    if (supabase) {
      carregarBloqueios();
    }
  }, []);

  return {
    bloqueios,
    loading,
    criarBloqueio,
    deletarBloqueio,
    atualizarBloqueio,
    carregarBloqueios
  };
};
