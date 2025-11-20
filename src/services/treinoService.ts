export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weight: number;
}

export interface Treino {
  id: string;
  userId: string;
  name: string;
  date: string;
  exercises: Exercise[];
  totalVolume: number;
}

const STORAGE_KEY = "treinos";

// Função auxiliar para obter treinos do localStorage
const getTreinosFromStorage = (): Treino[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Erro ao carregar treinos:", error);
    return [];
  }
};

// Função auxiliar para salvar treinos no localStorage
const saveTreinosToStorage = (treinos: Treino[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(treinos));
  } catch (error) {
    console.error("Erro ao salvar treinos:", error);
  }
};

export const treinoService = {
  // Obter todos os treinos do usuário
  getTreinos: (userId: string): Treino[] => {
    const treinos = getTreinosFromStorage();
    return treinos.filter((t) => t.userId === userId);
  },

  // Obter um treino específico
  getTreino: (id: string, userId: string): Treino | null => {
    const treinos = getTreinosFromStorage();
    const treino = treinos.find((t) => t.id === id && t.userId === userId);
    return treino || null;
  },

  // Criar novo treino
  createTreino: (treino: Omit<Treino, "id" | "totalVolume">): Treino => {
    const treinos = getTreinosFromStorage();
    const totalVolume = treino.exercises.reduce(
      (total, ex) => total + ex.sets * ex.reps * ex.weight,
      0
    );

    const newTreino: Treino = {
      ...treino,
      id: Date.now().toString(),
      totalVolume,
    };

    treinos.push(newTreino);
    saveTreinosToStorage(treinos);
    return newTreino;
  },

  // Atualizar treino existente
  updateTreino: (id: string, userId: string, updates: Partial<Treino>): Treino | null => {
    const treinos = getTreinosFromStorage();
    const index = treinos.findIndex((t) => t.id === id && t.userId === userId);

    if (index === -1) return null;

    const updatedTreino = { ...treinos[index], ...updates };
    
    // Recalcular volume se exercícios foram atualizados
    if (updates.exercises) {
      updatedTreino.totalVolume = updates.exercises.reduce(
        (total, ex) => total + ex.sets * ex.reps * ex.weight,
        0
      );
    }

    treinos[index] = updatedTreino;
    saveTreinosToStorage(treinos);
    return updatedTreino;
  },

  // Deletar treino
  deleteTreino: (id: string, userId: string): boolean => {
    const treinos = getTreinosFromStorage();
    const filtered = treinos.filter((t) => !(t.id === id && t.userId === userId));
    
    if (filtered.length === treinos.length) return false;
    
    saveTreinosToStorage(filtered);
    return true;
  },

  // Obter estatísticas do usuário
  getStats: (userId: string) => {
    const treinos = getTreinosFromStorage().filter((t) => t.userId === userId);
    const now = new Date();
    const thisMonth = treinos.filter(
      (t) => new Date(t.date).getMonth() === now.getMonth() &&
             new Date(t.date).getFullYear() === now.getFullYear()
    );
    const lastMonth = treinos.filter((t) => {
      const date = new Date(t.date);
      const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1);
      return date.getMonth() === lastMonthDate.getMonth() &&
             date.getFullYear() === lastMonthDate.getFullYear();
    });

    const totalVolume = treinos.reduce((sum, t) => sum + t.totalVolume, 0);
    const thisMonthVolume = thisMonth.reduce((sum, t) => sum + t.totalVolume, 0);
    const lastMonthVolume = lastMonth.reduce((sum, t) => sum + t.totalVolume, 0);

    // Calcular sequência de dias consecutivos
    const sortedTreinos = [...treinos].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (const treino of sortedTreinos) {
      const treinoDate = new Date(treino.date);
      treinoDate.setHours(0, 0, 0, 0);
      
      const diffDays = Math.floor(
        (currentDate.getTime() - treinoDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays === streak) {
        streak++;
        currentDate = treinoDate;
      } else if (diffDays > streak) {
        break;
      }
    }

    return {
      totalTreinos: treinos.length,
      treinosThisMonth: thisMonth.length,
      treinosLastMonth: lastMonth.length,
      totalVolume: totalVolume / 1000, // em toneladas
      thisMonthVolume: thisMonthVolume / 1000,
      lastMonthVolume: lastMonthVolume / 1000,
      streak,
    };
  },
};

