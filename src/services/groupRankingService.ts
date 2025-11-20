// Serviço para Rankings e Pontuação dos Grupos
import { supabase } from "@/config/supabase";

export interface MemberStats {
  id: string;
  group_id: string;
  user_id: string;
  user_name: string;
  user_avatar_url?: string;
  total_points: number;
  posts_count: number;
  likes_received: number;
  comments_made: number;
  reactions_received: number;
  total_workout_minutes: number;
  is_top_contributor: boolean;
  is_most_consistent: boolean;
  is_motivation_master: boolean;
  rank?: number;
  created_at: string;
  updated_at: string;
}

export interface GroupStats {
  member_count: number;
  total_posts: number;
  total_points: number;
  total_workout_minutes: number;
  top_member?: MemberStats;
}

export const groupRankingService = {
  // Buscar ranking de membros de um grupo
  async getGroupRanking(groupId: string): Promise<MemberStats[]> {
    if (!supabase) throw new Error("Supabase não configurado");

    const { data, error } = await supabase
      .from("group_member_stats")
      .select("*")
      .eq("group_id", groupId)
      .order("total_points", { ascending: false });

    if (error) throw error;

    // Adicionar rank manualmente
    return (data || []).map((member, index) => ({
      ...member,
      rank: index + 1,
    }));
  },

  // Buscar estatísticas de um membro específico
  async getMemberStats(groupId: string, userId: string): Promise<MemberStats | null> {
    if (!supabase) throw new Error("Supabase não configurado");

    const { data, error } = await supabase
      .from("group_member_stats")
      .select("*")
      .eq("group_id", groupId)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw error;

    if (!data) return null;

    // Buscar rank
    const { data: allMembers } = await supabase
      .from("group_member_stats")
      .select("user_id, total_points")
      .eq("group_id", groupId)
      .order("total_points", { ascending: false });

    const rank = (allMembers || []).findIndex((m) => m.user_id === userId) + 1;

    return {
      ...data,
      rank,
    };
  },

  // Buscar estatísticas gerais do grupo
  async getGroupStats(groupId: string): Promise<GroupStats> {
    if (!supabase) throw new Error("Supabase não configurado");

    // Buscar contagem de membros
    const { count: memberCount } = await supabase
      .from("group_members")
      .select("*", { count: "exact", head: true })
      .eq("group_id", groupId);

    // Buscar stats dos membros
    const { data: memberStats } = await supabase
      .from("group_member_stats")
      .select("*")
      .eq("group_id", groupId);

    const stats: GroupStats = {
      member_count: memberCount || 0,
      total_posts: 0,
      total_points: 0,
      total_workout_minutes: 0,
    };

    if (memberStats && memberStats.length > 0) {
      stats.total_posts = memberStats.reduce((sum, m) => sum + m.posts_count, 0);
      stats.total_points = memberStats.reduce((sum, m) => sum + m.total_points, 0);
      stats.total_workout_minutes = memberStats.reduce(
        (sum, m) => sum + m.total_workout_minutes,
        0
      );

      // Top member (maior pontuação)
      const topMember = [...memberStats].sort((a, b) => b.total_points - a.total_points)[0];
      if (topMember) {
        stats.top_member = {
          ...topMember,
          rank: 1,
        };
      }
    }

    return stats;
  },

  // Atualizar badges de gamificação (chamado manualmente ou por cronjob)
  async updateGroupBadges(): Promise<void> {
    if (!supabase) throw new Error("Supabase não configurado");

    const { error } = await supabase.rpc("update_group_badges");

    if (error) {
      console.error("Erro ao atualizar badges:", error);
      throw error;
    }
  },

  // Buscar top 3 membros de um grupo
  async getTopMembers(groupId: string, limit: number = 3): Promise<MemberStats[]> {
    if (!supabase) throw new Error("Supabase não configurado");

    const { data, error } = await supabase
      .from("group_member_stats")
      .select("*")
      .eq("group_id", groupId)
      .order("total_points", { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data || []).map((member, index) => ({
      ...member,
      rank: index + 1,
    }));
  },

  // Formatar minutos em horas/dias
  formatWorkoutTime(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} min`;
    } else if (minutes < 1440) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
    } else {
      const days = Math.floor(minutes / 1440);
      const hours = Math.floor((minutes % 1440) / 60);
      return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
    }
  },

  // Calcular nível baseado em pontos
  calculateLevel(points: number): { level: number; progress: number; nextLevelPoints: number } {
    // Cada nível precisa de 100 pontos a mais que o anterior
    // Nível 1: 0-100, Nível 2: 101-300, Nível 3: 301-600, etc.
    let level = 1;
    let requiredPoints = 100;
    let totalPoints = 0;

    while (points >= totalPoints + requiredPoints) {
      totalPoints += requiredPoints;
      level++;
      requiredPoints += 100; // Aumenta 100 pontos por nível
    }

    const currentLevelPoints = points - totalPoints;
    const progress = (currentLevelPoints / requiredPoints) * 100;

    return {
      level,
      progress: Math.round(progress),
      nextLevelPoints: requiredPoints - currentLevelPoints,
    };
  },
};

