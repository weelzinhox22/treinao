export interface Meta {
  id: string;
  userId: string;
  type: "weight" | "volume" | "reps" | "treinos" | "streak";
  exerciseName?: string; // Para metas de exercício específico
  target: number;
  current: number;
  unit: string; // "kg", "reps", "treinos", "dias"
  description: string;
  deadline?: string; // Data limite (opcional)
  createdAt: string;
  achieved: boolean;
  achievedAt?: string;
}

const STORAGE_KEY = "metas";

const getMetasFromStorage = (): Meta[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Erro ao carregar metas:", error);
    return [];
  }
};

const saveMetasToStorage = (metas: Meta[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(metas));
  } catch (error) {
    console.error("Erro ao salvar metas:", error);
  }
};

export const metasService = {
  // Obter todas as metas do usuário
  getMetas: (userId: string): Meta[] => {
    const metas = getMetasFromStorage();
    return metas
      .filter((m) => m.userId === userId)
      .sort((a, b) => {
        // Não alcançadas primeiro, depois por data de criação
        if (a.achieved !== b.achieved) {
          return a.achieved ? 1 : -1;
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  },

  // Obter meta por ID
  getMeta: (id: string, userId: string): Meta | null => {
    const metas = getMetasFromStorage();
    return metas.find((m) => m.id === id && m.userId === userId) || null;
  },

  // Criar nova meta
  createMeta: (meta: Omit<Meta, "id" | "current" | "achieved" | "createdAt">): Meta => {
    const metas = getMetasFromStorage();
    const newMeta: Meta = {
      ...meta,
      id: Date.now().toString(),
      current: 0,
      achieved: false,
      createdAt: new Date().toISOString(),
    };

    metas.push(newMeta);
    saveMetasToStorage(metas);
    return newMeta;
  },

  // Atualizar meta
  updateMeta: (id: string, userId: string, updates: Partial<Meta>): Meta | null => {
    const metas = getMetasFromStorage();
    const index = metas.findIndex((m) => m.id === id && m.userId === userId);

    if (index === -1) return null;

    const updatedMeta = { ...metas[index], ...updates };
    
    // Verificar se a meta foi alcançada
    if (!updatedMeta.achieved && updatedMeta.current >= updatedMeta.target) {
      updatedMeta.achieved = true;
      updatedMeta.achievedAt = new Date().toISOString();
    }

    metas[index] = updatedMeta;
    saveMetasToStorage(metas);
    return updatedMeta;
  },

  // Deletar meta
  deleteMeta: (id: string, userId: string): boolean => {
    const metas = getMetasFromStorage();
    const filtered = metas.filter((m) => !(m.id === id && m.userId === userId));

    if (filtered.length === metas.length) return false;

    saveMetasToStorage(filtered);
    return true;
  },

  // Atualizar progresso das metas automaticamente
  updateProgress: (userId: string, getCurrentValue: (meta: Meta) => number): void => {
    const metas = getMetasFromStorage().filter((m) => m.userId === userId && !m.achieved);
    
    metas.forEach((meta) => {
      const current = getCurrentValue(meta);
      if (current !== meta.current) {
        metasService.updateMeta(meta.id, userId, { current });
      }
    });
  },
};

