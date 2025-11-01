import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';
import * as XLSX from 'xlsx';

type DecisaoJudicial = Database['public']['Tables']['decisoes_judiciais']['Row'] & {
  profiles?: { nome: string | null } | null;
};
type NovaDecisaoJudicial = Database['public']['Tables']['decisoes_judiciais']['Insert'];

export const useDecisoes = () => {
  const [decisoes, setDecisoes] = useState<DecisaoJudicial[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const carregarDecisoes = async () => {
    setLoading(true);
    try {
      // Primeiro carregar as decisões
      const { data: decisoesData, error: decisoesError } = await supabase
        .from('decisoes_judiciais')
        .select('*')
        .order('data_criacao', { ascending: false });

      if (decisoesError) throw decisoesError;

      // Depois carregar os perfis dos usuários que criaram as decisões
      const userIds = [...new Set(decisoesData?.map(d => d.user_id).filter(Boolean) || [])];
      
      let profilesMap: { [key: string]: { nome: string | null } } = {};
      
      if (userIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, nome')
          .in('id', userIds);

        if (!profilesError && profilesData) {
          profilesMap = profilesData.reduce((acc, profile) => {
            acc[profile.id] = { nome: profile.nome };
            return acc;
          }, {} as { [key: string]: { nome: string | null } });
        }
      }

      // Combinar os dados
      const decisoesComPerfis = decisoesData?.map(decisao => ({
        ...decisao,
        profiles: decisao.user_id ? profilesMap[decisao.user_id] : null
      })) || [];

      setDecisoes(decisoesComPerfis as any);
    } catch (error) {
      console.error('Erro ao carregar decisões:', error);
      toast({
        title: "Erro ao carregar decisões",
        description: "Não foi possível carregar as decisões judiciais.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const criarDecisao = async (dados: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Remover análise_ia do objeto antes de inserir
      const { analise_ia, ...dadosDecisao } = dados;

      const { data, error } = await supabase
        .from('decisoes_judiciais')
        .insert([{ 
          ...dadosDecisao, 
          user_id: user.id,
          codigo_unico: '' // Será gerado pelo trigger
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Decisão registrada!",
        description: `Protocolo ${data.codigo_unico} gerado com sucesso.`,
      });

      // Se houver análise de IA, salvar na tabela analises_decisoes
      if (analise_ia) {
        const { error: analiseError } = await supabase
          .from('analises_decisoes')
          .insert([{
            decisao_id: data.id,
            termos_frequentes: analise_ia.termosFrequentes || null,
            doutrinas_citadas: analise_ia.doutrinasCitadas || null,
            julgados_citados: analise_ia.julgadosCitados || null,
            padrao_decisao: analise_ia.resumo || null
          }]);

        if (analiseError) {
          console.error('Erro ao salvar análise:', analiseError);
        }
      }

      await carregarDecisoes();
      return data;
    } catch (error) {
      console.error('Erro ao criar decisão:', error);
      toast({
        title: "Erro ao registrar decisão",
        description: "Não foi possível registrar a decisão judicial.",
        variant: "destructive"
      });
      throw error;
    }
  };

  const deletarDecisao = async (id: string) => {
    try {
      const { error } = await supabase
        .from('decisoes_judiciais')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Decisão excluída",
        description: "A decisão foi removida com sucesso.",
      });

      await carregarDecisoes();
    } catch (error) {
      console.error('Erro ao deletar decisão:', error);
      toast({
        title: "Erro ao excluir decisão",
        description: "Não foi possível excluir a decisão.",
        variant: "destructive"
      });
    }
  };

  const exportarParaCSV = () => {
    if (decisoes.length === 0) {
      toast({
        title: "Nenhuma decisão para exportar",
        variant: "destructive"
      });
      return;
    }

    const headers = [
      'Protocolo', 'Processo', 'Comarca', 'Órgão', 'Vara/Câmara/Turma',
      'Cliente', 'Tipo Decisão', 'Magistrado', 'Advogado Interno', 
      'Adverso', 'Objeto/Procedimento', 'Resumo', 'Data Registro', 'Registrado Por'
    ];

    const csvContent = [
      headers.join(','),
      ...decisoes.map(d => [
        d.codigo_unico,
        d.numero_processo,
        d.comarca || '',
        d.orgao,
        d.vara_tribunal,
        d.nome_cliente,
        d.tipo_decisao,
        d.nome_magistrado,
        d.advogado_interno,
        d.adverso,
        d.procedimento_objeto,
        `"${d.resumo_decisao.replace(/"/g, '""')}"`,
        new Date(d.data_criacao).toLocaleDateString('pt-BR'),
        d.profiles?.nome || 'N/A'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `decisoes_judiciais_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast({
      title: "Exportação concluída",
      description: `${decisoes.length} decisões exportadas com sucesso.`,
    });
  };

  const exportarParaExcel = () => {
    if (decisoes.length === 0) {
      toast({
        title: "Nenhuma decisão para exportar",
        variant: "destructive"
      });
      return;
    }

    const dados = decisoes.map(d => ({
      'Protocolo': d.codigo_unico,
      'Processo': d.numero_processo,
      'Comarca': d.comarca || '',
      'Órgão': d.orgao,
      'Vara/Câmara/Turma': d.vara_tribunal,
      'Cliente': d.nome_cliente,
      'Tipo Decisão': d.tipo_decisao,
      'Magistrado': d.nome_magistrado,
      'Advogado Interno': d.advogado_interno,
      'Adverso': d.adverso,
      'Objeto/Procedimento': d.procedimento_objeto,
      'Resumo': d.resumo_decisao,
      'Data Registro': new Date(d.data_criacao).toLocaleDateString('pt-BR'),
      'Registrado Por': d.profiles?.nome || 'N/A'
    }));

    const ws = XLSX.utils.json_to_sheet(dados);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Decisões Judiciais');

    // Ajustar largura das colunas
    const colWidths = [
      { wch: 20 }, // Protocolo
      { wch: 25 }, // Processo
      { wch: 20 }, // Comarca
      { wch: 30 }, // Órgão
      { wch: 30 }, // Vara/Câmara/Turma
      { wch: 30 }, // Cliente
      { wch: 20 }, // Tipo Decisão
      { wch: 30 }, // Magistrado
      { wch: 25 }, // Advogado Interno
      { wch: 30 }, // Adverso
      { wch: 40 }, // Objeto/Procedimento
      { wch: 60 }, // Resumo
      { wch: 15 }, // Data Registro
      { wch: 25 }  // Registrado Por
    ];
    ws['!cols'] = colWidths;

    XLSX.writeFile(wb, `decisoes_judiciais_${new Date().toISOString().split('T')[0]}.xlsx`);

    toast({
      title: "Exportação concluída",
      description: `${decisoes.length} decisões exportadas com sucesso.`,
    });
  };

  useEffect(() => {
    if (supabase) {
      carregarDecisoes();
    }
  }, []);

  return {
    decisoes,
    loading,
    carregarDecisoes,
    criarDecisao,
    deletarDecisao,
    exportarParaCSV,
    exportarParaExcel
  };
};