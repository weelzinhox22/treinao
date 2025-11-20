export interface Badge {
  id: string;
  name: string;
  description: string;
  detailedDescription?: string;
  icon: string;
  category: "treinos" | "volume" | "streak" | "recordes" | "metas" | "tempo";
  rarity: "common" | "rare" | "epic" | "legendary";
  unlockedAt?: string;
}

export interface Achievement {
  id: string;
  badgeId: string;
  userId: string;
  unlockedAt: string;
}

import { badgeDetailedDescriptions } from "@/utils/badgeDescriptions";

const badgesDatabase: Omit<Badge, "unlockedAt">[] = [
  // ========== TREINOS ==========
  { id: "first_workout", name: "Primeiro Passo", description: "Registre seu primeiro treino", icon: "🎯", category: "treinos", rarity: "common" },
  { id: "5_workouts", name: "Começando Bem", description: "Complete 5 treinos", icon: "🌱", category: "treinos", rarity: "common" },
  { id: "10_workouts", name: "Dedicação", description: "Complete 10 treinos", icon: "💪", category: "treinos", rarity: "common" },
  { id: "25_workouts", name: "Em Ritmo", description: "Complete 25 treinos", icon: "⚡", category: "treinos", rarity: "common" },
  { id: "50_workouts", name: "Consistência", description: "Complete 50 treinos", icon: "🔥", category: "treinos", rarity: "rare" },
  { id: "75_workouts", name: "Determinação", description: "Complete 75 treinos", icon: "💎", category: "treinos", rarity: "rare" },
  { id: "100_workouts", name: "Veterano", description: "Complete 100 treinos", icon: "🏆", category: "treinos", rarity: "epic" },
  { id: "200_workouts", name: "Mestre", description: "Complete 200 treinos", icon: "🎖️", category: "treinos", rarity: "epic" },
  { id: "300_workouts", name: "Elite", description: "Complete 300 treinos", icon: "🌟", category: "treinos", rarity: "epic" },
  { id: "500_workouts", name: "Lenda", description: "Complete 500 treinos", icon: "👑", category: "treinos", rarity: "legendary" },
  { id: "1000_workouts", name: "Imortal", description: "Complete 1000 treinos", icon: "⚡", category: "treinos", rarity: "legendary" },

  // ========== STREAKS ==========
  { id: "streak_2", name: "No Jogo", description: "2 dias consecutivos", icon: "🎮", category: "streak", rarity: "common" },
  { id: "streak_3", name: "Em Forma", description: "3 dias consecutivos", icon: "⚡", category: "streak", rarity: "common" },
  { id: "streak_5", name: "Semana Iniciada", description: "5 dias consecutivos", icon: "📆", category: "streak", rarity: "common" },
  { id: "streak_7", name: "Semana Forte", description: "7 dias consecutivos", icon: "🌟", category: "streak", rarity: "common" },
  { id: "streak_10", name: "Dez Dias", description: "10 dias consecutivos", icon: "🔟", category: "streak", rarity: "rare" },
  { id: "streak_14", name: "Duas Semanas", description: "14 dias consecutivos", icon: "📅", category: "streak", rarity: "rare" },
  { id: "streak_21", name: "Três Semanas", description: "21 dias consecutivos", icon: "💫", category: "streak", rarity: "rare" },
  { id: "streak_30", name: "Mês Perfeito", description: "30 dias consecutivos", icon: "💎", category: "streak", rarity: "epic" },
  { id: "streak_50", name: "Quase Dois Meses", description: "50 dias consecutivos", icon: "🔥", category: "streak", rarity: "epic" },
  { id: "streak_60", name: "Dois Meses", description: "60 dias consecutivos", icon: "⭐", category: "streak", rarity: "epic" },
  { id: "streak_90", name: "Três Meses", description: "90 dias consecutivos", icon: "🏅", category: "streak", rarity: "epic" },
  { id: "streak_100", name: "Disciplina Absoluta", description: "100 dias consecutivos", icon: "🏅", category: "streak", rarity: "legendary" },
  { id: "streak_180", name: "Meio Ano", description: "180 dias consecutivos", icon: "🌍", category: "streak", rarity: "legendary" },
  { id: "streak_365", name: "Ano Completo", description: "365 dias consecutivos", icon: "🌞", category: "streak", rarity: "legendary" },

  // ========== VOLUME ==========
  { id: "volume_500kg", name: "Meia Tonelada", description: "Acumule 500kg de volume", icon: "⚖️", category: "volume", rarity: "common" },
  { id: "volume_1t", name: "Tonelada", description: "Acumule 1 tonelada de volume", icon: "⚖️", category: "volume", rarity: "common" },
  { id: "volume_2t", name: "Duas Toneladas", description: "Acumule 2 toneladas de volume", icon: "💪", category: "volume", rarity: "common" },
  { id: "volume_5t", name: "Cinco Toneladas", description: "Acumule 5 toneladas de volume", icon: "🔥", category: "volume", rarity: "rare" },
  { id: "volume_10t", name: "Força Bruta", description: "Acumule 10 toneladas de volume", icon: "💥", category: "volume", rarity: "rare" },
  { id: "volume_20t", name: "Poder Absoluto", description: "Acumule 20 toneladas de volume", icon: "⚡", category: "volume", rarity: "rare" },
  { id: "volume_50t", name: "Gigante", description: "Acumule 50 toneladas de volume", icon: "🗿", category: "volume", rarity: "epic" },
  { id: "volume_100t", name: "Titã", description: "Acumule 100 toneladas de volume", icon: "🗿", category: "volume", rarity: "epic" },
  { id: "volume_200t", name: "Colosso", description: "Acumule 200 toneladas de volume", icon: "🏔️", category: "volume", rarity: "legendary" },
  { id: "volume_500t", name: "Força Divina", description: "Acumule 500 toneladas de volume", icon: "🌋", category: "volume", rarity: "legendary" },

  // ========== RECORDES ==========
  { id: "first_pr", name: "Recorde Pessoal", description: "Bata seu primeiro recorde", icon: "📈", category: "recordes", rarity: "common" },
  { id: "3_prs", name: "Superando-se", description: "Bata 3 recordes pessoais", icon: "📊", category: "recordes", rarity: "common" },
  { id: "5_prs", name: "Em Ascensão", description: "Bata 5 recordes pessoais", icon: "🚀", category: "recordes", rarity: "rare" },
  { id: "10_prs", name: "Superando Limites", description: "Bata 10 recordes pessoais", icon: "🚀", category: "recordes", rarity: "rare" },
  { id: "20_prs", name: "Quebrando Barreiras", description: "Bata 20 recordes pessoais", icon: "💥", category: "recordes", rarity: "epic" },
  { id: "50_prs", name: "Máquina de Recordes", description: "Bata 50 recordes pessoais", icon: "⚡", category: "recordes", rarity: "epic" },
  { id: "100_prs", name: "Lendário", description: "Bata 100 recordes pessoais", icon: "👑", category: "recordes", rarity: "legendary" },

  // ========== METAS ==========
  { id: "first_goal", name: "Objetivo", description: "Alcance sua primeira meta", icon: "🎯", category: "metas", rarity: "common" },
  { id: "3_goals", name: "Focado", description: "Alcance 3 metas", icon: "🎪", category: "metas", rarity: "common" },
  { id: "5_goals", name: "Determinado", description: "Alcance 5 metas", icon: "⭐", category: "metas", rarity: "rare" },
  { id: "10_goals", name: "Conquistador", description: "Alcance 10 metas", icon: "⭐", category: "metas", rarity: "epic" },
  { id: "20_goals", name: "Mestre dos Objetivos", description: "Alcance 20 metas", icon: "🏆", category: "metas", rarity: "epic" },
  { id: "50_goals", name: "Lenda dos Objetivos", description: "Alcance 50 metas", icon: "👑", category: "metas", rarity: "legendary" },

  // ========== TEMPO ==========
  { id: "week_3", name: "Semana Ativa", description: "3 treinos em uma semana", icon: "📅", category: "tempo", rarity: "common" },
  { id: "week_5", name: "Semana Intensa", description: "5 treinos em uma semana", icon: "🔥", category: "tempo", rarity: "rare" },
  { id: "month_10", name: "Mês Regular", description: "10 treinos em um mês", icon: "📆", category: "tempo", rarity: "common" },
  { id: "month_15", name: "Mês Ativo", description: "15 treinos em um mês", icon: "💪", category: "tempo", rarity: "common" },
  { id: "month_20", name: "Ativo", description: "20 treinos em um mês", icon: "📅", category: "tempo", rarity: "common" },
  { id: "month_25", name: "Mês Intenso", description: "25 treinos em um mês", icon: "⚡", category: "tempo", rarity: "rare" },
  { id: "month_30", name: "Mês Perfeito", description: "30 treinos em um mês", icon: "🌟", category: "tempo", rarity: "epic" },
  { id: "year_50", name: "Ano Regular", description: "50 treinos em um ano", icon: "📊", category: "tempo", rarity: "common" },
  { id: "year_100", name: "Ano de Ouro", description: "100 treinos em um ano", icon: "✨", category: "tempo", rarity: "epic" },
  { id: "year_200", name: "Ano Épico", description: "200 treinos em um ano", icon: "💎", category: "tempo", rarity: "epic" },
  { id: "year_300", name: "Ano Lendário", description: "300 treinos em um ano", icon: "👑", category: "tempo", rarity: "legendary" },

  // ========== EXERCÍCIOS ESPECÍFICOS ==========
  { id: "exercise_10", name: "Especialista", description: "10 treinos com o mesmo exercício", icon: "🎯", category: "treinos", rarity: "common" },
  { id: "exercise_25", name: "Mestre do Exercício", description: "25 treinos com o mesmo exercício", icon: "🏅", category: "treinos", rarity: "rare" },
  { id: "exercise_50", name: "Lenda do Exercício", description: "50 treinos com o mesmo exercício", icon: "👑", category: "treinos", rarity: "epic" },
  { id: "exercise_100kg", name: "Centenário", description: "Alcance 100kg em um exercício", icon: "💯", category: "recordes", rarity: "rare" },
  { id: "exercise_150kg", name: "Cento e Cinquenta", description: "Alcance 150kg em um exercício", icon: "🔥", category: "recordes", rarity: "epic" },
  { id: "exercise_200kg", name: "Duzentos", description: "Alcance 200kg em um exercício", icon: "💪", category: "recordes", rarity: "epic" },
  { id: "exercise_300kg", name: "Trezentos", description: "Alcance 300kg em um exercício", icon: "⚡", category: "recordes", rarity: "legendary" },

  // ========== GRUPOS E DESAFIOS ==========
  { id: "first_group", name: "Líder", description: "Crie seu primeiro grupo", icon: "👥", category: "treinos", rarity: "common" },
  { id: "join_group", name: "Membro", description: "Entre em um grupo", icon: "🤝", category: "treinos", rarity: "common" },
  { id: "group_5_members", name: "Comunidade", description: "Tenha 5 membros no seu grupo", icon: "👨‍👩‍👧‍👦", category: "treinos", rarity: "rare" },
  { id: "group_10_members", name: "Tribo", description: "Tenha 10 membros no seu grupo", icon: "🏘️", category: "treinos", rarity: "epic" },
  { id: "group_20_members", name: "Legião", description: "Tenha 20 membros no seu grupo", icon: "🏛️", category: "treinos", rarity: "epic" },
  { id: "first_challenge", name: "Desafiador", description: "Crie seu primeiro desafio", icon: "🎯", category: "treinos", rarity: "common" },
  { id: "join_challenge", name: "Competidor", description: "Participe de um desafio", icon: "🏃", category: "treinos", rarity: "common" },
  { id: "challenge_winner", name: "Campeão", description: "Vença um desafio", icon: "🥇", category: "treinos", rarity: "epic" },
  { id: "challenge_top3", name: "Pódio", description: "Fique no top 3 de um desafio", icon: "🏆", category: "treinos", rarity: "rare" },
  { id: "challenge_1000pts", name: "Mil Pontos", description: "Acumule 1000 pontos em desafios", icon: "💯", category: "treinos", rarity: "rare" },
  { id: "challenge_5000pts", name: "Cinco Mil", description: "Acumule 5000 pontos em desafios", icon: "⭐", category: "treinos", rarity: "epic" },
  { id: "challenge_10000pts", name: "Dez Mil", description: "Acumule 10000 pontos em desafios", icon: "🌟", category: "treinos", rarity: "legendary" },
  { id: "group_leader", name: "Líder do Ranking", description: "Fique em 1º lugar no ranking do grupo", icon: "👑", category: "treinos", rarity: "epic" },
  { id: "challenge_5", name: "Veterano de Desafios", description: "Participe de 5 desafios", icon: "🎖️", category: "treinos", rarity: "rare" },
  { id: "challenge_10", name: "Mestre de Desafios", description: "Participe de 10 desafios", icon: "🏅", category: "treinos", rarity: "epic" },

  // ========== ESPECIAIS ==========
  { id: "early_bird", name: "Madrugador", description: "Treine antes das 6h", icon: "🌅", category: "tempo", rarity: "rare" },
  { id: "night_owl", name: "Coruja", description: "Treine depois das 22h", icon: "🦉", category: "tempo", rarity: "rare" },
  { id: "weekend_warrior", name: "Guerreiro de Fim de Semana", description: "10 treinos no fim de semana", icon: "🎮", category: "tempo", rarity: "common" },
  { id: "full_body", name: "Corpo Completo", description: "Treine todos os grupos musculares", icon: "🧘", category: "treinos", rarity: "rare" },
  { id: "cardio_king", name: "Rei do Cardio", description: "10 treinos de cardio", icon: "❤️", category: "treinos", rarity: "common" },
  { id: "strength_master", name: "Mestre da Força", description: "50 treinos focados em força", icon: "💎", category: "treinos", rarity: "epic" },
  { id: "volume_king", name: "Rei do Volume", description: "10 toneladas em um mês", icon: "👑", category: "volume", rarity: "epic" },
  { id: "consistency_god", name: "Deus da Consistência", description: "100 dias sem faltar", icon: "🌞", category: "streak", rarity: "legendary" },
  { id: "first_photo", name: "Primeira Foto", description: "Adicione sua primeira foto de progresso", icon: "📸", category: "treinos", rarity: "common" },
  { id: "10_photos", name: "Documentando", description: "Adicione 10 fotos de progresso", icon: "📷", category: "treinos", rarity: "rare" },
  { id: "template_master", name: "Mestre de Templates", description: "Crie 5 templates personalizados", icon: "📋", category: "treinos", rarity: "rare" },
];

const STORAGE_KEY = "achievements";

const getAchievementsFromStorage = (): Achievement[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Erro ao carregar conquistas:", error);
    return [];
  }
};

const saveAchievementsToStorage = (achievements: Achievement[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(achievements));
  } catch (error) {
    console.error("Erro ao salvar conquistas:", error);
  }
};

export const gamificationService = {
  // Obter todas as badges
  getAllBadges: (): Omit<Badge, "unlockedAt">[] => {
    return badgesDatabase;
  },

  // Obter conquistas do usuário
  getAchievements: (userId: string): Achievement[] => {
    return getAchievementsFromStorage().filter((a) => a.userId === userId);
  },

  // Obter badges desbloqueadas pelo usuário
  getUnlockedBadges: (userId: string): Badge[] => {
    const achievements = gamificationService.getAchievements(userId);
    return badgesDatabase
      .filter((badge) => achievements.some((a) => a.badgeId === badge.id))
      .map((badge) => {
        const achievement = achievements.find((a) => a.badgeId === badge.id);
        return {
          ...badge,
          detailedDescription: badgeDetailedDescriptions[badge.id],
          unlockedAt: achievement?.unlockedAt,
        };
      });
  },

  // Obter badge com descrição detalhada
  getBadgeWithDetails: (badgeId: string): Badge | undefined => {
    const badge = badgesDatabase.find((b) => b.id === badgeId);
    if (!badge) return undefined;
    return {
      ...badge,
      detailedDescription: badgeDetailedDescriptions[badgeId],
    };
  },

  // Desbloquear badge
  unlockBadge: (userId: string, badgeId: string): boolean => {
    const achievements = getAchievementsFromStorage();
    
    // Verificar se já foi desbloqueada
    if (achievements.some((a) => a.userId === userId && a.badgeId === badgeId)) {
      return false;
    }

    achievements.push({
      id: Date.now().toString(),
      badgeId,
      userId,
      unlockedAt: new Date().toISOString(),
    });

    saveAchievementsToStorage(achievements);
    return true;
  },

  // Verificar e desbloquear badges automaticamente
  checkAndUnlockBadges: (userId: string, stats: {
    totalTreinos: number;
    streak: number;
    totalVolume: number;
    recordesBatidos: number;
    metasAlcancadas: number;
    treinosEsteMes: number;
    treinosEsteAno: number;
    treinosEstaSemana?: number;
    maxWeight?: number;
    exerciciosUnicos?: number;
    fotosAdicionadas?: number;
    templatesCriados?: number;
  }): string[] => {
    const unlocked: string[] = [];

    // Badges de treinos
    const treinoBadges = [
      { threshold: 1, id: "first_workout" },
      { threshold: 5, id: "5_workouts" },
      { threshold: 10, id: "10_workouts" },
      { threshold: 25, id: "25_workouts" },
      { threshold: 50, id: "50_workouts" },
      { threshold: 75, id: "75_workouts" },
      { threshold: 100, id: "100_workouts" },
      { threshold: 200, id: "200_workouts" },
      { threshold: 300, id: "300_workouts" },
      { threshold: 500, id: "500_workouts" },
      { threshold: 1000, id: "1000_workouts" },
    ];

    treinoBadges.forEach(({ threshold, id }) => {
      if (stats.totalTreinos >= threshold && gamificationService.unlockBadge(userId, id)) {
        unlocked.push(id);
      }
    });

    // Badges de streak
    const streakBadges = [
      { threshold: 2, id: "streak_2" },
      { threshold: 3, id: "streak_3" },
      { threshold: 5, id: "streak_5" },
      { threshold: 7, id: "streak_7" },
      { threshold: 10, id: "streak_10" },
      { threshold: 14, id: "streak_14" },
      { threshold: 21, id: "streak_21" },
      { threshold: 30, id: "streak_30" },
      { threshold: 50, id: "streak_50" },
      { threshold: 60, id: "streak_60" },
      { threshold: 90, id: "streak_90" },
      { threshold: 100, id: "streak_100" },
      { threshold: 180, id: "streak_180" },
      { threshold: 365, id: "streak_365" },
    ];

    streakBadges.forEach(({ threshold, id }) => {
      if (stats.streak >= threshold && gamificationService.unlockBadge(userId, id)) {
        unlocked.push(id);
      }
    });

    // Badges de volume
    const volumeBadges = [
      { threshold: 0.5, id: "volume_500kg" },
      { threshold: 1, id: "volume_1t" },
      { threshold: 2, id: "volume_2t" },
      { threshold: 5, id: "volume_5t" },
      { threshold: 10, id: "volume_10t" },
      { threshold: 20, id: "volume_20t" },
      { threshold: 50, id: "volume_50t" },
      { threshold: 100, id: "volume_100t" },
      { threshold: 200, id: "volume_200t" },
      { threshold: 500, id: "volume_500t" },
    ];

    volumeBadges.forEach(({ threshold, id }) => {
      if (stats.totalVolume >= threshold && gamificationService.unlockBadge(userId, id)) {
        unlocked.push(id);
      }
    });

    // Badges de recordes
    const prBadges = [
      { threshold: 1, id: "first_pr" },
      { threshold: 3, id: "3_prs" },
      { threshold: 5, id: "5_prs" },
      { threshold: 10, id: "10_prs" },
      { threshold: 20, id: "20_prs" },
      { threshold: 50, id: "50_prs" },
      { threshold: 100, id: "100_prs" },
    ];

    prBadges.forEach(({ threshold, id }) => {
      if (stats.recordesBatidos >= threshold && gamificationService.unlockBadge(userId, id)) {
        unlocked.push(id);
      }
    });

    // Badges de metas
    const goalBadges = [
      { threshold: 1, id: "first_goal" },
      { threshold: 3, id: "3_goals" },
      { threshold: 5, id: "5_goals" },
      { threshold: 10, id: "10_goals" },
      { threshold: 20, id: "20_goals" },
      { threshold: 50, id: "50_goals" },
    ];

    goalBadges.forEach(({ threshold, id }) => {
      if (stats.metasAlcancadas >= threshold && gamificationService.unlockBadge(userId, id)) {
        unlocked.push(id);
      }
    });

    // Badges de tempo (semana)
    if (stats.treinosEstaSemana) {
      if (stats.treinosEstaSemana >= 3 && gamificationService.unlockBadge(userId, "week_3")) {
        unlocked.push("week_3");
      }
      if (stats.treinosEstaSemana >= 5 && gamificationService.unlockBadge(userId, "week_5")) {
        unlocked.push("week_5");
      }
    }

    // Badges de tempo (mês)
    const monthBadges = [
      { threshold: 10, id: "month_10" },
      { threshold: 15, id: "month_15" },
      { threshold: 20, id: "month_20" },
      { threshold: 25, id: "month_25" },
      { threshold: 30, id: "month_30" },
    ];

    monthBadges.forEach(({ threshold, id }) => {
      if (stats.treinosEsteMes >= threshold && gamificationService.unlockBadge(userId, id)) {
        unlocked.push(id);
      }
    });

    // Badges de tempo (ano)
    const yearBadges = [
      { threshold: 50, id: "year_50" },
      { threshold: 100, id: "year_100" },
      { threshold: 200, id: "year_200" },
      { threshold: 300, id: "year_300" },
    ];

    yearBadges.forEach(({ threshold, id }) => {
      if (stats.treinosEsteAno >= threshold && gamificationService.unlockBadge(userId, id)) {
        unlocked.push(id);
      }
    });

    // Badges especiais
    if (stats.maxWeight && stats.maxWeight >= 100 && gamificationService.unlockBadge(userId, "exercise_100kg")) {
      unlocked.push("exercise_100kg");
    }
    if (stats.maxWeight && stats.maxWeight >= 150 && gamificationService.unlockBadge(userId, "exercise_150kg")) {
      unlocked.push("exercise_150kg");
    }
    if (stats.maxWeight && stats.maxWeight >= 200 && gamificationService.unlockBadge(userId, "exercise_200kg")) {
      unlocked.push("exercise_200kg");
    }
    if (stats.maxWeight && stats.maxWeight >= 300 && gamificationService.unlockBadge(userId, "exercise_300kg")) {
      unlocked.push("exercise_300kg");
    }

    if (stats.fotosAdicionadas) {
      if (stats.fotosAdicionadas >= 1 && gamificationService.unlockBadge(userId, "first_photo")) {
        unlocked.push("first_photo");
      }
      if (stats.fotosAdicionadas >= 10 && gamificationService.unlockBadge(userId, "10_photos")) {
        unlocked.push("10_photos");
      }
    }

    if (stats.templatesCriados && stats.templatesCriados >= 5 && gamificationService.unlockBadge(userId, "template_master")) {
      unlocked.push("template_master");
    }

    return unlocked;
  },
};

