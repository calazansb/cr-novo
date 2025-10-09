import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ProcessoCNJ {
  numeroProcesso: string;
  classe: string;
  assuntos: string;
  orgaoJulgador: string;
  dataAjuizamento: string;
  tribunal: string;
  grau: string;
  movimentos: any[];
  sistema: string;
  formato: string;
  partesPoloAtivo: string[];
  partesPoloPassivo: string[];
  todasPartes: string[];
}

export const useCNJSearch = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const buscarProcesso = async (numeroProcesso: string): Promise<ProcessoCNJ | null> => {
    const digits = numeroProcesso?.replace(/\D/g, '') || '';
    if (!digits || digits.length < 20) {
      return null;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('buscar-processo-cnj', {
        body: { numeroProcesso }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Processo encontrado!",
          description: "Dados preenchidos automaticamente do CNJ.",
        });
        return data.data;
      } else {
        toast({
          title: "Processo não encontrado",
          description: data.message || "Não foi possível encontrar o processo no CNJ.",
          variant: "destructive",
        });
        return null;
      }
    } catch (error) {
      console.error('Erro ao buscar processo:', error);
      toast({
        title: "Erro na busca",
        description: "Não foi possível buscar os dados do processo no CNJ.",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { buscarProcesso, loading };
};