// Serviço para Ranking Global
import { supabase } from "@/config/supabase";

export interface GlobalUserStats {
  user_id: string;
  user_name: string;
  user_avatar_url?: string;
  total_points: number;
  total_posts: number;
  total_workouts: number;
  total_likes_received: number;
  total_comments_made: number;
  total_workout_minutes: number;
  total_volume_kg: number;
  global_rank: number;
  created_at: string;
  updated_at: string;
}

export const globalRankingService = {
  // Buscar ranking global (top N)
  async getGlobalRanking(limit: number = 50): Promise<GlobalUserStats[]> {
    if (!supabase) throw new Error("Supabase não configurado");

    const { data, error } = await supabase
      .from("global_user_stats")
      .select("*")
      .order("global_rank", { ascending: true })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  // Buscar estatísticas de um usuário específico
  async getUserStats(userId: string): Promise<GlobalUserStats | null> {
    if (!supabase) throw new Error("Supabase não configurado");

    const { data, error } = await supabase
      .from("global_user_stats")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  // Atualizar rankings (chamar periodicamente ou após eventos importantes)
  async updateRankings(): Promise<void> {
    if (!supabase) throw new Error("Supabase não configurado");

    const { error } = await supabase.rpc("update_global_rankings");

    if (error) {
      console.error("Erro ao atualizar rankings:", error);
      throw error;
    }
  },

  // Buscar usuários próximos no ranking
  async getNearbyUsers(userId: string, range: number = 5): Promise<GlobalUserStats[]> {
    if (!supabase) throw new Error("Supabase não configurado");

    // Primeiro buscar o rank do usuário
    const userStats = await this.getUserStats(userId);
    if (!userStats) return [];

    const minRank = Math.max(1, userStats.global_rank - range);
    const maxRank = userStats.global_rank + range;

    const { data, error } = await supabase
      .from("global_user_stats")
      .select("*")
      .gte("global_rank", minRank)
      .lte("global_rank", maxRank)
      .order("global_rank", { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Formatar tempo de treino
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
    let level = 1;
    let requiredPoints = 100;
    let totalPoints = 0;

    while (points >= totalPoints + requiredPoints) {
      totalPoints += requiredPoints;
      level++;
      requiredPoints += 100;
    }

    const currentLevelPoints = points - totalPoints;
    const progress = (currentLevelPoints / requiredPoints) * 100;

    return {
      level,
      progress: Math.round(progress),
      nextLevelPoints: requiredPoints - currentLevelPoints,
    };
  },

  // Obter emoji/badge baseado no rank
  getRankEmoji(rank: number): string {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    if (rank <= 10) return "🏅";
    if (rank <= 50) return "⭐";
    return "💪";
  },
};

