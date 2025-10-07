import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Usuario {
  id: string;
  nome: string;
}

export const useUsuarios = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, nome')
          .order('nome');
        
        if (data && !error) {
          // Remover asteriscos dos nomes
          const usuariosLimpos = data.map(u => ({
            ...u,
            nome: u.nome?.replace(/\*+$/, '').trim() || ''
          })).filter(u => u.nome); // Remover usuários sem nome
          
          setUsuarios(usuariosLimpos);
        }
      } catch (error) {
        console.error('Erro ao buscar usuários:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsuarios();
  }, []);

  return { usuarios, loading };
};
