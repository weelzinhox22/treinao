import { supabase } from "@/config/supabase";
import { supabaseService } from "./supabaseService";

export interface UserFollow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface UserProfileStats {
  user_id: string;
  user_name: string;
  avatar_url?: string;
  bio?: string;
  followers_count: number;
  following_count: number;
  posts_count: number;
  total_points: number;
}

class FollowService {
  // Verificar se está seguindo
  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    if (!supabaseService.isConfigured() || !supabase) {
      return this.isFollowingLocalStorage(followerId, followingId);
    }

    try {
      const { data, error } = await supabase
        .from('user_follows')
        .select('id')
        .eq('follower_id', followerId.toString())
        .eq('following_id', followingId.toString())
        .maybeSingle();

      if (error) throw error;
      return !!data;
    } catch (error) {
      console.error('Erro ao verificar se está seguindo:', error);
      return this.isFollowingLocalStorage(followerId, followingId);
    }
  }

  // Seguir usuário
  async followUser(followerId: string, followingId: string): Promise<UserFollow> {
    if (!supabaseService.isConfigured() || !supabase) {
      return this.followUserLocalStorage(followerId, followingId);
    }

    try {
      const { data, error } = await supabase
        .from('user_follows')
        .insert({
          follower_id: followerId.toString(),
          following_id: followingId.toString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao seguir usuário:', error);
      throw error;
    }
  }

  // Deixar de seguir
  async unfollowUser(followerId: string, followingId: string): Promise<void> {
    if (!supabaseService.isConfigured() || !supabase) {
      this.unfollowUserLocalStorage(followerId, followingId);
      return;
    }

    try {
      const { error } = await supabase
        .from('user_follows')
        .delete()
        .eq('follower_id', followerId.toString())
        .eq('following_id', followingId.toString());

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao deixar de seguir:', error);
      throw error;
    }
  }

  // Buscar seguidores
  async getFollowers(userId: string): Promise<UserFollow[]> {
    if (!supabaseService.isConfigured() || !supabase) {
      return this.getFollowersLocalStorage(userId);
    }

    try {
      const { data, error } = await supabase
        .from('user_follows')
        .select('*')
        .eq('following_id', userId.toString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar seguidores:', error);
      return this.getFollowersLocalStorage(userId);
    }
  }

  // Buscar quem está seguindo
  async getFollowing(userId: string): Promise<UserFollow[]> {
    if (!supabaseService.isConfigured() || !supabase) {
      return this.getFollowingLocalStorage(userId);
    }

    try {
      const { data, error } = await supabase
        .from('user_follows')
        .select('*')
        .eq('follower_id', userId.toString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar seguindo:', error);
      return this.getFollowingLocalStorage(userId);
    }
  }

  // Buscar estatísticas do perfil
  async getProfileStats(userId: string): Promise<UserProfileStats | null> {
    if (!supabaseService.isConfigured() || !supabase) {
      return this.getProfileStatsLocalStorage(userId);
    }

    try {
      const { data, error } = await supabase
        .from('user_profile_stats')
        .select('*')
        .eq('user_id', userId.toString())
        .maybeSingle();

      if (error) throw error;
      
      // Se não encontrou na view, buscar manualmente
      if (!data) {
        return await this.getProfileStatsManual(userId);
      }
      
      return data;
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      return this.getProfileStatsLocalStorage(userId);
    }
  }

  // Buscar feed de posts de quem você segue
  async getFollowingFeed(userId: string, limit: number = 50): Promise<any[]> {
    if (!supabaseService.isConfigured() || !supabase) {
      return [];
    }

    try {
      // Buscar IDs de quem você segue
      const { data: following } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', userId);

      if (!following || following.length === 0) {
        return [];
      }

      const followingIds = following.map(f => f.following_id.toString());

      // Buscar posts desses usuários
      const { data, error } = await supabase
        .from('group_posts')
        .select('*')
        .in('user_id', followingIds)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar feed seguindo:', error);
      return [];
    }
  }

  // LocalStorage fallback
  private isFollowingLocalStorage(followerId: string, followingId: string): boolean {
    try {
      const stored = localStorage.getItem(`follows_${followerId}`);
      const follows: string[] = stored ? JSON.parse(stored) : [];
      return follows.includes(followingId);
    } catch {
      return false;
    }
  }

  private followUserLocalStorage(followerId: string, followingId: string): UserFollow {
    try {
      const stored = localStorage.getItem(`follows_${followerId}`);
      const follows: string[] = stored ? JSON.parse(stored) : [];
      if (!follows.includes(followingId)) {
        follows.push(followingId);
        localStorage.setItem(`follows_${followerId}`, JSON.stringify(follows));
      }
      return {
        id: Date.now().toString(),
        follower_id: followerId,
        following_id: followingId,
        created_at: new Date().toISOString(),
      };
    } catch {
      throw new Error('Erro ao seguir usuário');
    }
  }

  private unfollowUserLocalStorage(followerId: string, followingId: string): void {
    try {
      const stored = localStorage.getItem(`follows_${followerId}`);
      const follows: string[] = stored ? JSON.parse(stored) : [];
      const filtered = follows.filter(id => id !== followingId);
      localStorage.setItem(`follows_${followerId}`, JSON.stringify(filtered));
    } catch {
      // Ignore
    }
  }

  private getFollowersLocalStorage(userId: string): UserFollow[] {
    // Não há como saber quem te segue apenas com localStorage
    return [];
  }

  private getFollowingLocalStorage(userId: string): UserFollow[] {
    try {
      const stored = localStorage.getItem(`follows_${userId}`);
      const followingIds: string[] = stored ? JSON.parse(stored) : [];
      return followingIds.map(id => ({
        id: Date.now().toString() + id,
        follower_id: userId,
        following_id: id,
        created_at: new Date().toISOString(),
      }));
    } catch {
      return [];
    }
  }

  private getProfileStatsLocalStorage(userId: string): UserProfileStats | null {
    // Retornar stats básicos do localStorage se possível
    return {
      user_id: userId,
      user_name: 'Usuário',
      followers_count: 0,
      following_count: 0,
      posts_count: 0,
      total_points: 0,
    };
  }

  // Buscar stats manualmente se a view não funcionar
  private async getProfileStatsManual(userId: string): Promise<UserProfileStats | null> {
    if (!supabase) return null;

    try {
      const [followers, following, posts, userData] = await Promise.all([
        supabase
          .from('user_follows')
          .select('id', { count: 'exact', head: true })
          .eq('following_id', userId.toString()),
        supabase
          .from('user_follows')
          .select('id', { count: 'exact', head: true })
          .eq('follower_id', userId.toString()),
        supabase
          .from('group_posts')
          .select('id, points', { count: 'exact' })
          .eq('user_id', userId.toString()),
        supabase
          .from('users')
          .select('name, avatar_url, bio')
          .eq('id', userId.toString())
          .single(),
      ]);

      const postsData = posts.data || [];
      const totalPoints = postsData.reduce((sum: number, p: any) => sum + (p.points || 0), 0);

      return {
        user_id: userId,
        user_name: userData.data?.name || 'Usuário',
        avatar_url: userData.data?.avatar_url || undefined,
        bio: userData.data?.bio || undefined,
        followers_count: followers.count || 0,
        following_count: following.count || 0,
        posts_count: posts.count || 0,
        total_points: totalPoints,
      };
    } catch (error) {
      console.error('Erro ao buscar stats manual:', error);
      return this.getProfileStatsLocalStorage(userId);
    }
  }
}

export const followService = new FollowService();

