import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SugestaoErro {
  id: string;
  codigo_unico: string;
  tipo: 'sugestao' | 'erro';
  categoria: string;
  titulo: string;
  descricao: string;
  beneficios?: string;
  urgencia: string;
  tipo_erro?: string;
  gravidade?: string;
  numero_processo?: string;
  responsavel?: string;
  cliente?: string;
  prazo_correcao?: string;
  impacto?: string;
  acao_corretiva?: string;
  status: string;
  observacoes?: string;
  user_id?: string;
  created_at: string;
  updated_at: string;
}

export interface NovaSugestaoErro {
  tipo: 'sugestao' | 'erro';
  categoria: string;
  titulo: string;
  descricao: string;
  beneficios?: string;
  urgencia: string;
  tipo_erro?: string;
  gravidade?: string;
  numero_processo?: string;
  responsavel?: string;
  cliente?: string;
  prazo_correcao?: string;
  impacto?: string;
  acao_corretiva?: string;
}

export const useSugestoesErros = () => {
  const [registros, setRegistros] = useState<SugestaoErro[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const carregarRegistros = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('sugestoes_erros')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRegistros((data || []) as SugestaoErro[]);
    } catch (error) {
      console.error('Erro ao carregar registros:', error);
      toast({
        title: "Erro ao carregar registros",
        description: "Não foi possível carregar os registros.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const criarRegistro = async (dados: NovaSugestaoErro) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const insertData: any = {
        tipo: dados.tipo,
        categoria: dados.categoria,
        titulo: dados.titulo,
        descricao: dados.descricao,
        urgencia: dados.urgencia
      };

      if (dados.beneficios) insertData.beneficios = dados.beneficios;
      if (dados.tipo_erro) insertData.tipo_erro = dados.tipo_erro;
      if (dados.gravidade) insertData.gravidade = dados.gravidade;
      if (dados.numero_processo) insertData.numero_processo = dados.numero_processo;
      if (dados.responsavel) insertData.responsavel = dados.responsavel;
      if (dados.cliente) insertData.cliente = dados.cliente;
      if (dados.prazo_correcao) insertData.prazo_correcao = dados.prazo_correcao;
      if (dados.impacto) insertData.impacto = dados.impacto;
      if (dados.acao_corretiva) insertData.acao_corretiva = dados.acao_corretiva;

      const { data, error } = await supabase
        .from('sugestoes_erros')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: dados.tipo === 'sugestao' ? "Sugestão registrada!" : "Erro registrado!",
        description: `Protocolo: ${data.codigo_unico}`,
      });

      await carregarRegistros();
      return data;
    } catch (error) {
      console.error('Erro ao criar registro:', error);
      toast({
        title: "Erro ao registrar",
        description: "Não foi possível registrar.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const atualizarRegistro = async (id: string, dados: Partial<NovaSugestaoErro>) => {
    try {
      const { error } = await supabase
        .from('sugestoes_erros')
        .update(dados)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Registro atualizado",
        description: "O registro foi atualizado com sucesso.",
      });

      await carregarRegistros();
    } catch (error) {
      console.error('Erro ao atualizar registro:', error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar o registro.",
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
        .from('sugestoes_erros')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Status atualizado",
        description: "O status foi atualizado com sucesso.",
      });

      await carregarRegistros();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: "Erro ao atualizar status",
        description: "Não foi possível atualizar o status.",
        variant: "destructive",
      });
    }
  };

  const deletarRegistro = async (id: string) => {
    try {
      const { error } = await supabase
        .from('sugestoes_erros')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Registro excluído",
        description: "O registro foi excluído com sucesso.",
      });

      await carregarRegistros();
    } catch (error) {
      console.error('Erro ao deletar registro:', error);
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o registro.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (supabase) {
      carregarRegistros();
    }
  }, []);

  return {
    registros,
    loading,
    criarRegistro,
    atualizarRegistro,
    atualizarStatus,
    deletarRegistro,
    carregarRegistros
  };
};
