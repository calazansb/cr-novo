import { Bell, CheckCheck, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useNotifications } from '@/hooks/useNotifications';
import NotificationItem from './NotificationItem';
import { useNavigate } from 'react-router-dom';

interface NotificationListProps {
  onClose?: () => void;
}

const NotificationList = ({ onClose }: NotificationListProps) => {
  const {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll
  } = useNotifications();

  const navigate = useNavigate();

  const handleNotificationClick = (link?: string) => {
    if (link) {
      navigate(link);
      onClose?.();
    }
  };

  if (loading) {
    return (
      <div className="w-80 p-4 text-center">
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="w-80">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            <h3 className="font-semibold">Notificações</h3>
          </div>
          {unreadCount > 0 && (
            <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full font-medium">
              {unreadCount} {unreadCount === 1 ? 'nova' : 'novas'}
            </span>
          )}
        </div>

        {notifications.length > 0 && (
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-7"
                onClick={markAllAsRead}
              >
                <CheckCheck className="w-3 h-3 mr-1" />
                Marcar todas como lidas
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7"
              onClick={clearAll}
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Limpar todas
            </Button>
          </div>
        )}
      </div>

      {/* Lista de notificações */}
      {notifications.length === 0 ? (
        <div className="p-8 text-center">
          <Bell className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            Nenhuma notificação
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Você está em dia! 🎉
          </p>
        </div>
      ) : (
        <ScrollArea className="h-[400px]">
          <div className="divide-y divide-border">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={markAsRead}
                onDelete={deleteNotification}
                onClick={handleNotificationClick}
              />
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};

export default NotificationList;
