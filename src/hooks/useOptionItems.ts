import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface OptionItem {
  id: string;
  option_set_id: string;
  label: string;
  value: string;
  order: number;
  is_active: boolean;
  is_default: boolean;
  meta?: Record<string, any>;
  deleted_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface OptionSet {
  id: string;
  key: string;
  label: string;
  description?: string;
}

interface UseOptionItemsOptions {
  activeOnly?: boolean;
  includeDeleted?: boolean;
}

export function useOptionItems(
  optionSetKey: string,
  options: UseOptionItemsOptions = { activeOnly: true, includeDeleted: false }
) {
  const queryClient = useQueryClient();

  // Buscar option set pelo key
  const { data: optionSet } = useQuery({
    queryKey: ['option-set', optionSetKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('option_sets')
        .select('*')
        .eq('key', optionSetKey)
        .single();

      if (error) throw error;
      return data as OptionSet;
    },
  });

  // Buscar itens
  const { data: items = [], isLoading, error } = useQuery({
    queryKey: ['option-items', optionSetKey, options.activeOnly, options.includeDeleted],
    queryFn: async () => {
      if (!optionSet) return [];

      let query = supabase
        .from('option_items')
        .select('*')
        .eq('option_set_id', optionSet.id)
        .order('order', { ascending: true })
        .order('label', { ascending: true });

      // Filtros baseados nas opções
      if (options.activeOnly) {
        query = query.eq('is_active', true);
      }

      if (!options.includeDeleted) {
        query = query.is('deleted_at', null);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as OptionItem[];
    },
    enabled: !!optionSet,
  });

  // Mutation para criar item
  const createItem = useMutation({
    mutationFn: async (newItem: Partial<OptionItem>) => {
      if (!optionSet) throw new Error('Option set não encontrado');

      const { data: item, error: insertError } = await supabase
        .from('option_items')
        .insert({
          option_set_id: optionSet.id,
          label: newItem.label,
          value: newItem.value,
          order: newItem.order ?? 0,
          is_active: newItem.is_active ?? true,
          is_default: newItem.is_default ?? false,
          meta: newItem.meta ?? {},
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Criar log de auditoria
      const { data: { user } } = await supabase.auth.getUser();
      
      await supabase.from('option_audit_logs').insert({
        option_set_id: optionSet.id,
        option_item_id: item.id,
        actor_user_id: user?.id,
        action: 'CREATE',
        after: item,
      });

      return item;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['option-items', optionSetKey] });
      toast.success('Opção criada com sucesso');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao criar opção');
    },
  });

  // Mutation para atualizar item
  const updateItem = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<OptionItem> }) => {
      // Buscar estado anterior
      const { data: before } = await supabase
        .from('option_items')
        .select('*')
        .eq('id', id)
        .single();

      const { data: item, error: updateError } = await supabase
        .from('option_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Criar log de auditoria
      const { data: { user } } = await supabase.auth.getUser();
      
      await supabase.from('option_audit_logs').insert({
        option_set_id: optionSet?.id,
        option_item_id: id,
        actor_user_id: user?.id,
        action: 'UPDATE',
        before,
        after: item,
      });

      return item;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['option-items', optionSetKey] });
      toast.success('Opção atualizada com sucesso');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao atualizar opção');
    },
  });

  // Mutation para soft delete
  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const { data: before } = await supabase
        .from('option_items')
        .select('*')
        .eq('id', id)
        .single();

      const { error } = await supabase
        .from('option_items')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      // Criar log de auditoria
      const { data: { user } } = await supabase.auth.getUser();
      
      await supabase.from('option_audit_logs').insert({
        option_set_id: optionSet?.id,
        option_item_id: id,
        actor_user_id: user?.id,
        action: 'DELETE',
        before,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['option-items', optionSetKey] });
      toast.success('Opção removida com sucesso');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao remover opção');
    },
  });

  // Mutation para ativar/desativar
  const toggleActive = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { data: before } = await supabase
        .from('option_items')
        .select('*')
        .eq('id', id)
        .single();

      const { data: item, error } = await supabase
        .from('option_items')
        .update({ is_active: isActive })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Criar log de auditoria
      const { data: { user } } = await supabase.auth.getUser();
      
      await supabase.from('option_audit_logs').insert({
        option_set_id: optionSet?.id,
        option_item_id: id,
        actor_user_id: user?.id,
        action: isActive ? 'ACTIVATE' : 'DEACTIVATE',
        before,
        after: item,
      });

      return item;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['option-items', optionSetKey] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao alterar status da opção');
    },
  });

  // Mutation para reordenar
  const reorderItems = useMutation({
    mutationFn: async (orderedIds: string[]) => {
      const updates = orderedIds.map((id, index) => ({
        id,
        order: index,
      }));

      const promises = updates.map(({ id, order }) =>
        supabase.from('option_items').update({ order }).eq('id', id)
      );

      await Promise.all(promises);

      // Criar log de auditoria
      const { data: { user } } = await supabase.auth.getUser();
      
      await supabase.from('option_audit_logs').insert({
        option_set_id: optionSet?.id,
        actor_user_id: user?.id,
        action: 'REORDER',
        after: { orderedIds },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['option-items', optionSetKey] });
      toast.success('Ordem atualizada com sucesso');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao reordenar opções');
    },
  });

  return {
    optionSet,
    items,
    isLoading,
    error,
    createItem: createItem.mutate,
    updateItem: updateItem.mutate,
    deleteItem: deleteItem.mutate,
    toggleActive: toggleActive.mutate,
    reorderItems: reorderItems.mutate,
    isCreating: createItem.isPending,
    isUpdating: updateItem.isPending,
    isDeleting: deleteItem.isPending,
  };
}
