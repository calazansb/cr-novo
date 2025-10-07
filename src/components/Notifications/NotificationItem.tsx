import { Bell, CheckCircle, AlertCircle, Info, XCircle, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { Notification } from '@/hooks/useNotifications';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  onClick?: (link?: string) => void;
}

const NotificationItem = ({ 
  notification, 
  onMarkAsRead, 
  onDelete,
  onClick 
}: NotificationItemProps) => {
  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-success" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-warning" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-destructive" />;
      default:
        return <Info className="w-4 h-4 text-info" />;
    }
  };

  const getTypeColor = () => {
    switch (notification.type) {
      case 'success':
        return 'border-l-success';
      case 'warning':
        return 'border-l-warning';
      case 'error':
        return 'border-l-destructive';
      default:
        return 'border-l-info';
    }
  };

  const handleClick = () => {
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
    if (notification.link && onClick) {
      onClick(notification.link);
    }
  };

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-3 border-l-4 hover:bg-accent/50 transition-colors cursor-pointer group",
        getTypeColor(),
        !notification.read && "bg-accent/20"
      )}
      onClick={handleClick}
    >
      <div className="mt-1">{getIcon()}</div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h4 className={cn(
            "text-sm font-medium",
            !notification.read && "font-semibold"
          )}>
            {notification.title}
          </h4>
          
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(notification.id);
            }}
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
        
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
          {notification.message}
        </p>
        
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(notification.created_at), {
              addSuffix: true,
              locale: ptBR
            })}
          </span>
          
          {!notification.read && (
            <span className="w-2 h-2 bg-primary rounded-full"></span>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationItem;
