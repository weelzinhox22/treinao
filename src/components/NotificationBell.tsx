import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Bell, Check, CheckCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { notificationService, type Notification } from "@/services/notificationService";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

const NotificationBell = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (user) {
      loadNotifications();
      // Atualizar a cada 30 segundos
      const interval = setInterval(loadNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadNotifications = async () => {
    if (!user) return;

    try {
      const [notifs, count] = await Promise.all([
        notificationService.getNotifications(user.id, 20),
        notificationService.getUnreadCount(user.id),
      ]);

      setNotifications(notifs);
      setUnreadCount(count);
    } catch (error) {
      console.error("Erro ao carregar notificações:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Marcar como lida se não estiver lida
    if (!notification.read) {
      await notificationService.markAsRead(notification.id, user!.id);
      setNotifications(prev =>
        prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }

    // Fechar popover
    setOpen(false);

    // Navegar para o conteúdo relacionado baseado no tipo
    switch (notification.type) {
      case 'follow':
        // Navegar para o perfil de quem seguiu
        if (notification.data?.follower_id) {
          navigate(`/perfil/${notification.data.follower_id}`);
        }
        break;
      
      case 'like':
      case 'comment':
      case 'reaction':
        // Navegar para o post (via grupo se tiver group_id)
        if (notification.data?.post_id) {
          if (notification.data.group_id) {
            navigate(`/grupo/${notification.data.group_id}`);
          } else {
            // Se não tiver group_id, tentar buscar o post
            navigate(`/feed`);
          }
        }
        break;
      
      case 'badge':
        // Navegar para página de badges
        navigate('/badges');
        break;
      
      case 'goal':
        // Navegar para página de metas
        navigate('/metas');
        break;
      
      case 'challenge':
        // Navegar para grupos ou feed
        if (notification.data?.group_id) {
          navigate(`/grupo/${notification.data.group_id}`);
        } else {
          navigate('/feed');
        }
        break;
      
      case 'ranking':
        // Navegar para feed (onde tem ranking)
        navigate('/feed');
        break;
      
      case 'admin':
        // Notificações admin não navegam
        break;
      
      case 'workout_reminder':
        // Navegar para criar treino
        navigate('/novo-treino');
        break;
      
      default:
        // Navegar para feed por padrão
        navigate('/feed');
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;

    await notificationService.markAllAsRead(user.id);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };


  if (!user) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 md:w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notificações</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="h-8 text-xs"
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Marcar todas como lidas
            </Button>
          )}
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Carregando...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-sm text-muted-foreground">Nenhuma notificação</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "p-4 hover:bg-muted/50 transition-colors cursor-pointer",
                    !notification.read && "bg-primary/5"
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl flex-shrink-0">
                      {notification.type === 'like' ? '❤️' :
                       notification.type === 'comment' ? '💬' :
                       notification.type === 'reaction' ? (notification.data?.emoji || '😊') :
                       notification.type === 'follow' ? '👥' :
                       notification.type === 'badge' ? '🏆' :
                       notification.type === 'goal' ? '🎯' :
                       notification.type === 'admin' ? '📢' :
                       notification.type === 'workout_reminder' ? '⏰' :
                       notification.type === 'challenge' ? '🏆' :
                       notification.type === 'ranking' ? '🏅' :
                       '🔔'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{notification.title}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {formatDistanceToNow(new Date(notification.created_at), {
                              addSuffix: true,
                              locale: ptBR,
                            })}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;

