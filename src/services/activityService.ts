// Serviço para tipos de atividades/tipos de treino

export interface ActivityType {
  id: string;
  name: string;
  emoji: string;
  category: "strength" | "cardio" | "flexibility" | "sports" | "other";
  pointsPerMinute: number; // Pontos por minuto de treino
}

export const defaultActivityTypes: ActivityType[] = [
  // Musculação
  { id: "musculacao", name: "Musculação", emoji: "💪", category: "strength", pointsPerMinute: 2 },
  
  // Cardio
  { id: "corrida", name: "Corrida", emoji: "🏃", category: "cardio", pointsPerMinute: 1.5 },
  { id: "caminhada", name: "Caminhada", emoji: "🚶", category: "cardio", pointsPerMinute: 1 },
  { id: "ciclismo", name: "Ciclismo", emoji: "🚴", category: "cardio", pointsPerMinute: 2 },
  { id: "natacao", name: "Natação", emoji: "🏊", category: "cardio", pointsPerMinute: 2.5 },
  { id: "eliptico", name: "Elíptico", emoji: "🏃", category: "cardio", pointsPerMinute: 1.5 },
  { id: "esteira", name: "Esteira", emoji: "🏃", category: "cardio", pointsPerMinute: 1.5 },
  { id: "hiit", name: "HIIT", emoji: "⚡", category: "cardio", pointsPerMinute: 3 },
  { id: "spinning", name: "Spinning", emoji: "🚴", category: "cardio", pointsPerMinute: 2 },
  
  // Flexibilidade
  { id: "pilates", name: "Pilates", emoji: "🧘", category: "flexibility", pointsPerMinute: 1.5 },
  { id: "yoga", name: "Yoga", emoji: "🧘‍♀️", category: "flexibility", pointsPerMinute: 1.5 },
  { id: "alongamento", name: "Alongamento", emoji: "🤸", category: "flexibility", pointsPerMinute: 1 },
  { id: "mobilidade", name: "Mobilidade", emoji: "🤸‍♂️", category: "flexibility", pointsPerMinute: 1 },
  
  // Esportes
  { id: "futebol", name: "Futebol", emoji: "⚽", category: "sports", pointsPerMinute: 2 },
  { id: "basquete", name: "Basquete", emoji: "🏀", category: "sports", pointsPerMinute: 2 },
  { id: "volei", name: "Vôlei", emoji: "🏐", category: "sports", pointsPerMinute: 1.5 },
  { id: "tenis", name: "Tênis", emoji: "🎾", category: "sports", pointsPerMinute: 2 },
  { id: "boxe", name: "Boxe", emoji: "🥊", category: "sports", pointsPerMinute: 2.5 },
  { id: "muay_thai", name: "Muay Thai", emoji: "🥊", category: "sports", pointsPerMinute: 2.5 },
  { id: "jiu_jitsu", name: "Jiu-Jitsu", emoji: "🥋", category: "sports", pointsPerMinute: 2.5 },
  { id: "crossfit", name: "CrossFit", emoji: "🔥", category: "sports", pointsPerMinute: 3 },
  
  // Outros
  { id: "funcional", name: "Funcional", emoji: "⚡", category: "other", pointsPerMinute: 2 },
  { id: "calistenia", name: "Calistenia", emoji: "🤸", category: "other", pointsPerMinute: 2 },
  { id: "danca", name: "Dança", emoji: "💃", category: "other", pointsPerMinute: 1.5 },
  { id: "outro", name: "Outro", emoji: "🏋️‍♂️", category: "other", pointsPerMinute: 1 },
];

export const activityService = {
  getAllActivities: (): ActivityType[] => {
    return defaultActivityTypes;
  },

  getActivityById: (id: string): ActivityType | undefined => {
    return defaultActivityTypes.find((a) => a.id === id);
  },

  getActivitiesByCategory: (category: ActivityType["category"]): ActivityType[] => {
    return defaultActivityTypes.filter((a) => a.category === category);
  },

  searchActivities: (query: string): ActivityType[] => {
    const lowerQuery = query.toLowerCase();
    return defaultActivityTypes.filter(
      (a) =>
        a.name.toLowerCase().includes(lowerQuery) ||
        a.category.toLowerCase().includes(lowerQuery)
    );
  },

  calculatePoints: (activityId: string, durationMinutes: number): number => {
    const activity = activityService.getActivityById(activityId);
    if (!activity) return 0;
    return Math.round(activity.pointsPerMinute * durationMinutes);
  },
};

