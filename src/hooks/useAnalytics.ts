import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface FatoDecisao {
  decisao_id: string;
  processo_id: string;
  magistrado_nome: string;
  ano: number;
  trimestre: number;
  mes: number;
  data_decisao: string;
  valor_em_disputa_brl: number;
  economia_gerada_brl: number;
  percentual_exito: number;
  count_favoravel: number;
  count_parcial: number;
  count_desfavoravel: number;
  tribunal: string;
  camara_turma: string;
  tema: string;
  tipo_decisao: string;
  polo_cliente: string;
  cliente: string;
}

export interface DimMagistrado {
  nome: string;
  tribunal: string;
  camara_turma: string;
}

export interface DimTribunal {
  tribunal: string;
  esfera: string;
}

export interface DimTema {
  tema_normalizado: string;
}

export const useAnalytics = () => {
  const [fatoDecisao, setFatoDecisao] = useState<FatoDecisao[]>([]);
  const [dimMagistrado, setDimMagistrado] = useState<DimMagistrado[]>([]);
  const [dimTribunal, setDimTribunal] = useState<DimTribunal[]>([]);
  const [dimTema, setDimTema] = useState<DimTema[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    setLoading(true);
    try {
      // Carregar fato_decisao
      const { data: fatoData, error: fatoError } = await supabase
        .from('fato_decisao')
        .select('*')
        .order('data_decisao', { ascending: false });

      if (fatoError) throw fatoError;

      // Carregar dim_magistrado
      const { data: magistradoData, error: magistradoError } = await supabase
        .from('dim_magistrado')
        .select('*');

      if (magistradoError) throw magistradoError;

      // Carregar dim_tribunal
      const { data: tribunalData, error: tribunalError } = await supabase
        .from('dim_tribunal')
        .select('*');

      if (tribunalError) throw tribunalError;

      // Carregar dim_tema
      const { data: temaData, error: temaError } = await supabase
        .from('dim_tema')
        .select('*');

      if (temaError) throw temaError;

      setFatoDecisao(fatoData || []);
      setDimMagistrado(magistradoData || []);
      setDimTribunal(tribunalData || []);
      setDimTema(temaData || []);
    } catch (error) {
      console.error('Erro ao carregar dados analíticos:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados analíticos',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    fatoDecisao,
    dimMagistrado,
    dimTribunal,
    dimTema,
    loading,
    recarregar: carregarDados
  };
};
