import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface MetricasGerais {
  totalDecisoes: number;
  economiaTotal: number;
  taxaExito: number;
  decisoesUltimos30Dias: number;
  crescimentoMensal: number;
}

export interface PerformanceAdvogado {
  nome: string;
  totalDecisoes: number;
  taxaExito: number;
  economiaGerada: number;
  decisoesFavoraveis: number;
  decisoesParciais: number;
  decisaoDesfavoraveis: number;
}

export interface DistribuicaoResultado {
  resultado: string;
  quantidade: number;
  percentual: number;
  economia: number;
}

export interface TopMagistrado {
  nome: string;
  tribunal: string;
  totalDecisoes: number;
  taxaExito: number;
  economiaMedia: number;
}

export interface EvolucaoTemporal {
  mes: string;
  decisoes: number;
  economia: number;
  taxaExito: number;
}

export interface HeatmapTribunal {
  tribunal: string;
  comarca: string | null;
  totalDecisoes: number;
  taxaExito: number;
}

export const useDashboardExecutivo = () => {
  const [loading, setLoading] = useState(true);
  const [metricasGerais, setMetricasGerais] = useState<MetricasGerais | null>(null);
  const [performanceAdvogados, setPerformanceAdvogados] = useState<PerformanceAdvogado[]>([]);
  const [distribuicaoResultados, setDistribuicaoResultados] = useState<DistribuicaoResultado[]>([]);
  const [topMagistrados, setTopMagistrados] = useState<TopMagistrado[]>([]);
  const [evolucaoTemporal, setEvolucaoTemporal] = useState<EvolucaoTemporal[]>([]);
  const [heatmapTribunais, setHeatmapTribunais] = useState<HeatmapTribunal[]>([]);
  const { toast } = useToast();

  const carregarDados = async () => {
    setLoading(true);
    try {
      // Carregar todas as decisões
      const { data: decisoes, error } = await supabase
        .from('decisoes_judiciais')
        .select('*');

      if (error) throw error;
      if (!decisoes) return;

      // 1. Métricas Gerais
      const totalDecisoes = decisoes.length;
      const economiaTotal = decisoes.reduce((acc, d) => acc + (d.economia_gerada || 0), 0);
      const decisoesFavoraveis = decisoes.filter(d => 
        d.resultado?.toLowerCase().includes('favorável') || 
        d.resultado?.toLowerCase().includes('procedente')
      ).length;
      const taxaExito = totalDecisoes > 0 ? (decisoesFavoraveis / totalDecisoes) * 100 : 0;

      const hoje = new Date();
      const tresDiasAtras = new Date(hoje.getTime() - 30 * 24 * 60 * 60 * 1000);
      const decisoesUltimos30Dias = decisoes.filter(d => 
        d.data_criacao && new Date(d.data_criacao) >= tresDiasAtras
      ).length;

      const sessentaDiasAtras = new Date(hoje.getTime() - 60 * 24 * 60 * 60 * 1000);
      const decisoes30a60Dias = decisoes.filter(d => 
        d.data_criacao && 
        new Date(d.data_criacao) >= sessentaDiasAtras &&
        new Date(d.data_criacao) < tresDiasAtras
      ).length;

      const crescimentoMensal = decisoes30a60Dias > 0 
        ? ((decisoesUltimos30Dias - decisoes30a60Dias) / decisoes30a60Dias) * 100 
        : 0;

      setMetricasGerais({
        totalDecisoes,
        economiaTotal,
        taxaExito,
        decisoesUltimos30Dias,
        crescimentoMensal
      });

      // 2. Performance por Advogado
      const advogadosMap = new Map<string, PerformanceAdvogado>();
      decisoes.forEach(d => {
        const nome = d.advogado_interno || 'Não informado';
        if (!advogadosMap.has(nome)) {
          advogadosMap.set(nome, {
            nome,
            totalDecisoes: 0,
            taxaExito: 0,
            economiaGerada: 0,
            decisoesFavoraveis: 0,
            decisoesParciais: 0,
            decisaoDesfavoraveis: 0
          });
        }
        
        const adv = advogadosMap.get(nome)!;
        adv.totalDecisoes++;
        adv.economiaGerada += d.economia_gerada || 0;

        const resultado = d.resultado?.toLowerCase() || '';
        if (resultado.includes('favorável') || resultado.includes('procedente')) {
          adv.decisoesFavoraveis++;
        } else if (resultado.includes('parcial')) {
          adv.decisoesParciais++;
        } else {
          adv.decisaoDesfavoraveis++;
        }
      });

      advogadosMap.forEach(adv => {
        adv.taxaExito = adv.totalDecisoes > 0 
          ? (adv.decisoesFavoraveis / adv.totalDecisoes) * 100 
          : 0;
      });

      setPerformanceAdvogados(
        Array.from(advogadosMap.values())
          .sort((a, b) => b.economiaGerada - a.economiaGerada)
      );

      // 3. Distribuição por Resultado
      const resultadosMap = new Map<string, { quantidade: number; economia: number }>();
      decisoes.forEach(d => {
        const resultado = d.resultado || 'Não informado';
        if (!resultadosMap.has(resultado)) {
          resultadosMap.set(resultado, { quantidade: 0, economia: 0 });
        }
        const res = resultadosMap.get(resultado)!;
        res.quantidade++;
        res.economia += d.economia_gerada || 0;
      });

      const distribuicao = Array.from(resultadosMap.entries()).map(([resultado, data]) => ({
        resultado,
        quantidade: data.quantidade,
        percentual: (data.quantidade / totalDecisoes) * 100,
        economia: data.economia
      })).sort((a, b) => b.quantidade - a.quantidade);

      setDistribuicaoResultados(distribuicao);

      // 4. Top Magistrados
      const magistradosMap = new Map<string, { 
        tribunal: string;
        totalDecisoes: number;
        favoraveis: number;
        economiaTotal: number;
      }>();

      decisoes.forEach(d => {
        const nome = d.nome_magistrado;
        if (!magistradosMap.has(nome)) {
          magistradosMap.set(nome, {
            tribunal: d.orgao || 'Não informado',
            totalDecisoes: 0,
            favoraveis: 0,
            economiaTotal: 0
          });
        }

        const mag = magistradosMap.get(nome)!;
        mag.totalDecisoes++;
        mag.economiaTotal += d.economia_gerada || 0;

        const resultado = d.resultado?.toLowerCase() || '';
        if (resultado.includes('favorável') || resultado.includes('procedente')) {
          mag.favoraveis++;
        }
      });

      const topMags = Array.from(magistradosMap.entries())
        .map(([nome, data]) => ({
          nome,
          tribunal: data.tribunal,
          totalDecisoes: data.totalDecisoes,
          taxaExito: (data.favoraveis / data.totalDecisoes) * 100,
          economiaMedia: data.economiaTotal / data.totalDecisoes
        }))
        .sort((a, b) => b.taxaExito - a.taxaExito)
        .slice(0, 10);

      setTopMagistrados(topMags);

      // 5. Evolução Temporal (últimos 12 meses)
      const mesesMap = new Map<string, { decisoes: number; economia: number; favoraveis: number }>();
      const ultimosDozesMeses = Array.from({ length: 12 }, (_, i) => {
        const data = new Date();
        data.setMonth(data.getMonth() - i);
        return data.toISOString().slice(0, 7); // YYYY-MM
      }).reverse();

      ultimosDozesMeses.forEach(mes => {
        mesesMap.set(mes, { decisoes: 0, economia: 0, favoraveis: 0 });
      });

      decisoes.forEach(d => {
        if (!d.data_decisao) return;
        const mes = d.data_decisao.slice(0, 7);
        if (mesesMap.has(mes)) {
          const m = mesesMap.get(mes)!;
          m.decisoes++;
          m.economia += d.economia_gerada || 0;
          
          const resultado = d.resultado?.toLowerCase() || '';
          if (resultado.includes('favorável') || resultado.includes('procedente')) {
            m.favoraveis++;
          }
        }
      });

      const evolucao = Array.from(mesesMap.entries()).map(([mes, data]) => ({
        mes: new Date(mes + '-01').toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
        decisoes: data.decisoes,
        economia: data.economia,
        taxaExito: data.decisoes > 0 ? (data.favoraveis / data.decisoes) * 100 : 0
      }));

      setEvolucaoTemporal(evolucao);

      // 6. Heatmap por Tribunal
      const tribunaisMap = new Map<string, { 
        comarca: string | null;
        totalDecisoes: number;
        favoraveis: number;
      }>();

      decisoes.forEach(d => {
        const key = `${d.orgao}_${d.comarca || 'Geral'}`;
        if (!tribunaisMap.has(key)) {
          tribunaisMap.set(key, {
            comarca: d.comarca,
            totalDecisoes: 0,
            favoraveis: 0
          });
        }

        const trib = tribunaisMap.get(key)!;
        trib.totalDecisoes++;

        const resultado = d.resultado?.toLowerCase() || '';
        if (resultado.includes('favorável') || resultado.includes('procedente')) {
          trib.favoraveis++;
        }
      });

      const heatmap = Array.from(tribunaisMap.entries())
        .map(([key, data]) => ({
          tribunal: key.split('_')[0],
          comarca: data.comarca,
          totalDecisoes: data.totalDecisoes,
          taxaExito: (data.favoraveis / data.totalDecisoes) * 100
        }))
        .sort((a, b) => b.totalDecisoes - a.totalDecisoes)
        .slice(0, 20);

      setHeatmapTribunais(heatmap);

    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
      toast({
        title: "Erro ao carregar dashboard",
        description: "Não foi possível carregar os dados do dashboard executivo.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  return {
    loading,
    metricasGerais,
    performanceAdvogados,
    distribuicaoResultados,
    topMagistrados,
    evolucaoTemporal,
    heatmapTribunais,
    recarregar: carregarDados
  };
};
