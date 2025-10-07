import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  link?: string;
  read: boolean;
  created_at: string;
  updated_at: string;
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const unreadCount = notifications.filter(n => !n.read).length;

  // Carregar notificações iniciais
  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      try {
        const { data, error } = await (supabase as any)
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;
        setNotifications((data as Notification[]) || []);
      } catch (error) {
        console.error('Erro ao carregar notificações:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar as notificações',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [user, toast]);

  // Configurar Realtime
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('notifications-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications(prev => [newNotification, ...prev]);
          
          // Mostrar toast para nova notificação
          toast({
            title: newNotification.title,
            description: newNotification.message,
            variant: newNotification.type === 'error' ? 'destructive' : 'default'
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const updatedNotification = payload.new as Notification;
          setNotifications(prev =>
            prev.map(n => n.id === updatedNotification.id ? updatedNotification : n)
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const deletedId = payload.old.id;
          setNotifications(prev => prev.filter(n => n.id !== deletedId));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, toast]);

  // Marcar como lida
  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await (supabase as any)
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  };

  // Marcar todas como lidas
  const markAllAsRead = async () => {
    if (!user) return;

    try {
      const { error } = await (supabase as any)
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Todas as notificações foram marcadas como lidas'
      });
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível marcar as notificações como lidas',
        variant: 'destructive'
      });
    }
  };

  // Deletar notificação
  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await (supabase as any)
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao deletar notificação:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível deletar a notificação',
        variant: 'destructive'
      });
    }
  };

  // Limpar todas as notificações
  const clearAll = async () => {
    if (!user) return;

    try {
      const { error } = await (supabase as any)
        .from('notifications')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Todas as notificações foram removidas'
      });
    } catch (error) {
      console.error('Erro ao limpar notificações:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível limpar as notificações',
        variant: 'destructive'
      });
    }
  };

  return {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll
  };
};
