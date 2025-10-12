import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';
import * as XLSX from 'xlsx';

type DecisaoJudicial = Database['public']['Tables']['decisoes_judiciais']['Row'];
type NovaDecisaoJudicial = Database['public']['Tables']['decisoes_judiciais']['Insert'];

export const useDecisoes = () => {
  const [decisoes, setDecisoes] = useState<DecisaoJudicial[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const carregarDecisoes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('decisoes_judiciais')
        .select('*')
        .order('data_criacao', { ascending: false });

      if (error) throw error;
      setDecisoes(data || []);
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

  const criarDecisao = async (dados: Omit<NovaDecisaoJudicial, 'codigo_unico'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('decisoes_judiciais')
        .insert([{ 
          ...dados, 
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
      'Adverso', 'Objeto/Procedimento', 'Resumo', 'Data Registro'
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
        new Date(d.data_criacao).toLocaleDateString('pt-BR')
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
      'Data Registro': new Date(d.data_criacao).toLocaleDateString('pt-BR')
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
      { wch: 15 }  // Data Registro
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