import { supabase } from "@/config/supabase";
import { supabaseService } from "./supabaseService";

export interface Notification {
  id: string;
  user_id: string;
  type: 'like' | 'comment' | 'reaction' | 'follow' | 'badge' | 'goal' | 'admin' | 'workout_reminder' | 'group_post' | 'challenge' | 'ranking';
  title: string;
  message: string;
  data?: {
    post_id?: string;
    comment_id?: string;
    user_id?: string;
    user_name?: string;
    emoji?: string;
    content?: string;
    [key: string]: any;
  };
  read: boolean;
  created_at: string;
}

class NotificationService {
  // Buscar notificações do usuário
  async getNotifications(userId: string, limit: number = 50): Promise<Notification[]> {
    if (!supabaseService.isConfigured() || !supabase) {
      return this.getNotificationsFromLocalStorage(userId);
    }

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Salvar no localStorage também
      if (data) {
        localStorage.setItem(`notifications_${userId}`, JSON.stringify(data));
      }

      return data || [];
    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
      return this.getNotificationsFromLocalStorage(userId);
    }
  }

  // Buscar notificações não lidas
  async getUnreadCount(userId: string): Promise<number> {
    if (!supabaseService.isConfigured() || !supabase) {
      const notifications = this.getNotificationsFromLocalStorage(userId);
      return notifications.filter(n => !n.read).length;
    }

    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Erro ao contar notificações não lidas:', error);
      const notifications = this.getNotificationsFromLocalStorage(userId);
      return notifications.filter(n => !n.read).length;
    }
  }

  // Marcar notificação como lida
  async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    if (!supabaseService.isConfigured() || !supabase) {
      return this.markAsReadLocalStorage(notificationId, userId);
    }

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
        .eq('user_id', userId);

      if (error) throw error;

      // Atualizar localStorage
      this.markAsReadLocalStorage(notificationId, userId);

      return true;
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
      return this.markAsReadLocalStorage(notificationId, userId);
    }
  }

  // Marcar todas como lidas
  async markAllAsRead(userId: string): Promise<number> {
    if (!supabaseService.isConfigured() || !supabase) {
      return this.markAllAsReadLocalStorage(userId);
    }

    try {
      const { data, error } = await supabase.rpc('mark_all_notifications_read');

      if (error) throw error;

      // Atualizar localStorage
      this.markAllAsReadLocalStorage(userId);

      return data || 0;
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
      return this.markAllAsReadLocalStorage(userId);
    }
  }

  // Criar notificação (para uso interno)
  async createNotification(
    userId: string,
    type: Notification['type'],
    title: string,
    message: string,
    data?: Notification['data']
  ): Promise<Notification | null> {
    if (!supabaseService.isConfigured() || !supabase) {
      return this.createNotificationLocalStorage(userId, type, title, message, data);
    }

    try {
      const { data: notification, error } = await supabase.rpc('create_notification', {
        p_user_id: userId,
        p_type: type,
        p_title: title,
        p_message: message,
        p_data: data || null,
      });

      if (error) throw error;

      return notification;
    } catch (error) {
      console.error('Erro ao criar notificação:', error);
      return this.createNotificationLocalStorage(userId, type, title, message, data);
    }
  }

  // Admin: Enviar notificação para todos
  async sendToAll(
    type: Notification['type'],
    title: string,
    message: string,
    data?: Notification['data']
  ): Promise<number> {
    if (!supabaseService.isConfigured() || !supabase) {
      console.warn('Supabase não configurado. Notificação não enviada.');
      return 0;
    }

    try {
      const { data: count, error } = await supabase.rpc('send_notification_to_all', {
        p_type: type,
        p_title: title,
        p_message: message,
        p_data: data || null,
      });

      if (error) throw error;

      return count || 0;
    } catch (error) {
      console.error('Erro ao enviar notificação para todos:', error);
      throw error;
    }
  }

  // LocalStorage fallback
  private getNotificationsFromLocalStorage(userId: string): Notification[] {
    try {
      const stored = localStorage.getItem(`notifications_${userId}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private markAsReadLocalStorage(notificationId: string, userId: string): boolean {
    try {
      const notifications = this.getNotificationsFromLocalStorage(userId);
      const updated = notifications.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      );
      localStorage.setItem(`notifications_${userId}`, JSON.stringify(updated));
      return true;
    } catch {
      return false;
    }
  }

  private markAllAsReadLocalStorage(userId: string): number {
    try {
      const notifications = this.getNotificationsFromLocalStorage(userId);
      const updated = notifications.map(n => ({ ...n, read: true }));
      localStorage.setItem(`notifications_${userId}`, JSON.stringify(updated));
      return updated.length;
    } catch {
      return 0;
    }
  }

  private createNotificationLocalStorage(
    userId: string,
    type: Notification['type'],
    title: string,
    message: string,
    data?: Notification['data']
  ): Notification {
    const notification: Notification = {
      id: Date.now().toString(),
      user_id: userId,
      type,
      title,
      message,
      data,
      read: false,
      created_at: new Date().toISOString(),
    };

    const notifications = this.getNotificationsFromLocalStorage(userId);
    notifications.unshift(notification);
    localStorage.setItem(`notifications_${userId}`, JSON.stringify(notifications));

    return notification;
  }
}

export const notificationService = new NotificationService();

