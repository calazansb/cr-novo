import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ClienteCadastro {
  id: string;
  nome: string;
  abreviacao?: string;
  email?: string;
  telefone?: string;
  cpf_cnpj?: string;
  endereco?: string;
  observacoes?: string;
  created_at?: string;
  updated_at?: string;
}

export const useClientesCadastro = () => {
  const [clientes, setClientes] = useState<ClienteCadastro[]>([]);
  const [loading, setLoading] = useState(true);

  const carregarClientes = async () => {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('nome');
      
      if (error) throw error;
      setClientes(data || []);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      toast.error('Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  };

  const criarCliente = async (cliente: Omit<ClienteCadastro, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      // Verificar se a abreviação já existe
      if (cliente.abreviacao) {
        const { data: existente, error: checkError } = await supabase
          .from('clientes')
          .select('id, nome')
          .eq('abreviacao', cliente.abreviacao)
          .maybeSingle();
        
        if (checkError) throw checkError;
        
        if (existente) {
          toast.error(`A abreviação "${cliente.abreviacao}" já está sendo usada pelo cliente "${existente.nome}"`);
          return null;
        }
      }
      
      const { data, error } = await supabase
        .from('clientes')
        .insert([cliente])
        .select()
        .single();
      
      if (error) throw error;
      
      toast.success('Cliente cadastrado com sucesso');
      await carregarClientes();
      return data;
    } catch (error) {
      console.error('Erro ao criar cliente:', error);
      toast.error('Erro ao cadastrar cliente');
      return null;
    }
  };

  const atualizarCliente = async (id: string, cliente: Partial<ClienteCadastro>) => {
    try {
      // Verificar se a abreviação já existe em outro cliente
      if (cliente.abreviacao) {
        const { data: existente, error: checkError } = await supabase
          .from('clientes')
          .select('id, nome')
          .eq('abreviacao', cliente.abreviacao)
          .neq('id', id)
          .maybeSingle();
        
        if (checkError) throw checkError;
        
        if (existente) {
          toast.error(`A abreviação "${cliente.abreviacao}" já está sendo usada pelo cliente "${existente.nome}"`);
          return;
        }
      }
      
      const { error } = await supabase
        .from('clientes')
        .update(cliente)
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success('Cliente atualizado com sucesso');
      await carregarClientes();
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error);
      toast.error('Erro ao atualizar cliente');
    }
  };

  const deletarCliente = async (id: string) => {
    try {
      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success('Cliente deletado com sucesso');
      await carregarClientes();
    } catch (error) {
      console.error('Erro ao deletar cliente:', error);
      toast.error('Erro ao deletar cliente');
    }
  };

  useEffect(() => {
    carregarClientes();
  }, []);

  return {
    clientes,
    loading,
    criarCliente,
    atualizarCliente,
    deletarCliente,
    carregarClientes
  };
};
