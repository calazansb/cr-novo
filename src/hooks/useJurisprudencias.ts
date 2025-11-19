import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Jurisprudencia {
  id: string;
  codigo_unico: string;
  numero_processo: string;
  tribunal: string;
  area: string;
  ementa: string;
  data_julgamento: string | null;
  relator: string | null;
  resultado: string | null;
  arquivo_url: string | null;
  arquivo_nome: string | null;
  created_at: string;
}

export const useJurisprudencias = () => {
  const [jurisprudencias, setJurisprudencias] = useState<Jurisprudencia[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const carregarJurisprudencias = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('jurisprudencias')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJurisprudencias(data || []);
    } catch (error) {
      console.error('Erro ao carregar jurisprudências:', error);
      toast({
        title: "Erro ao carregar jurisprudências",
        description: "Não foi possível carregar a lista de jurisprudências.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const visualizarArquivo = async (filePath: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('get-decisao-file', {
        body: { filePath }
      });

      if (error) throw error;

      if (data.success && data.url) {
        window.open(data.url, '_blank');
      } else {
        throw new Error('URL não gerada');
      }
    } catch (error) {
      console.error('Erro ao visualizar arquivo:', error);
      toast({
        title: "Erro ao visualizar arquivo",
        description: "Não foi possível abrir o arquivo.",
        variant: "destructive",
      });
    }
  };

  const baixarArquivo = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('get-decisao-file', {
        body: { filePath }
      });

      if (error) throw error;

      if (data.success && data.url) {
        const response = await fetch(data.url);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast({
          title: "Download iniciado",
          description: `Baixando ${fileName}...`,
        });
      } else {
        throw new Error('URL não gerada');
      }
    } catch (error) {
      console.error('Erro ao baixar arquivo:', error);
      toast({
        title: "Erro ao baixar arquivo",
        description: "Não foi possível baixar o arquivo.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    carregarJurisprudencias();
  }, []);

  return {
    jurisprudencias,
    loading,
    visualizarArquivo,
    baixarArquivo,
    carregarJurisprudencias
  };
};
