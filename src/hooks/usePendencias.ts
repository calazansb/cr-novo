import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Pendencia {
  id: string;
  codigo_unico: string;
  numero_processo: string;
  orgao: string;
  tipo_urgencia: string;
  prazo_limite: string;
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

export interface NovaPendencia {
  numero_processo: string;
  orgao: string;
  tipo_urgencia: string;
  prazo_limite: string;
  responsavel: string;
  cliente: string;
  descricao: string;
  observacoes?: string;
}

export const usePendencias = () => {
  const [pendencias, setPendencias] = useState<Pendencia[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const carregarPendencias = async () => {
    try {
      setLoading(true);
      
      // Buscar pendências
      const { data: pendenciasData, error: pendenciasError } = await supabase
        .from('pendencias_urgencias')
        .select('*')
        .order('created_at', { ascending: false });

      if (pendenciasError) throw pendenciasError;

      // Buscar perfis dos usuários
      const userIds = [...new Set(pendenciasData?.map(p => p.user_id).filter(Boolean))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, nome')
        .in('id', userIds);

      // Mapear perfis aos dados
      const pendenciasComPerfis = pendenciasData?.map(pendencia => ({
        ...pendencia,
        profiles: profilesData?.find(p => p.id === pendencia.user_id)
      })) || [];

      setPendencias(pendenciasComPerfis);
    } catch (error) {
      console.error('Erro ao carregar pendências:', error);
      toast({
        title: "Erro ao carregar pendências",
        description: "Não foi possível carregar as pendências.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const criarPendencia = async (dados: NovaPendencia) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase
        .from('pendencias_urgencias')
        .insert({
          numero_processo: dados.numero_processo,
          orgao: dados.orgao,
          tipo_urgencia: dados.tipo_urgencia,
          prazo_limite: dados.prazo_limite,
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
        title: "Pendência registrada!",
        description: `Protocolo: ${data.codigo_unico}`,
      });

      await carregarPendencias();
      return data;
    } catch (error) {
      console.error('Erro ao criar pendência:', error);
      toast({
        title: "Erro ao registrar pendência",
        description: "Não foi possível registrar a pendência.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deletarPendencia = async (id: string) => {
    try {
      const { error } = await supabase
        .from('pendencias_urgencias')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Pendência excluída",
        description: "A pendência foi excluída com sucesso.",
      });

      await carregarPendencias();
    } catch (error) {
      console.error('Erro ao deletar pendência:', error);
      toast({
        title: "Erro ao excluir pendência",
        description: "Não foi possível excluir a pendência.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (supabase) {
      carregarPendencias();
    }
  }, []);

  return {
    pendencias,
    loading,
    criarPendencia,
    deletarPendencia,
    carregarPendencias
  };
};