import { treinoService, type Exercise } from "./treinoService";

export interface Template {
  id: string;
  name: string;
  description: string;
  exercises: Omit<Exercise, "id">[];
  category: "Push/Pull/Legs" | "Full Body" | "Upper/Lower" | "Personalizado";
  isDefault: boolean;
  userId?: string;
}

const defaultTemplates: Template[] = [
  {
    id: "push",
    name: "Push (Empurrar)",
    description: "Peito, Ombro e Tríceps",
    category: "Push/Pull/Legs",
    isDefault: true,
    exercises: [
      { name: "Supino Reto", sets: 4, reps: 8, weight: 0 },
      { name: "Supino Inclinado", sets: 3, reps: 10, weight: 0 },
      { name: "Desenvolvimento", sets: 3, reps: 10, weight: 0 },
      { name: "Elevação Lateral", sets: 3, reps: 12, weight: 0 },
      { name: "Tríceps Pulley", sets: 3, reps: 12, weight: 0 },
      { name: "Tríceps Testa", sets: 3, reps: 10, weight: 0 },
    ],
  },
  {
    id: "pull",
    name: "Pull (Puxar)",
    description: "Costas e Bíceps",
    category: "Push/Pull/Legs",
    isDefault: true,
    exercises: [
      { name: "Barra Fixa", sets: 4, reps: 8, weight: 0 },
      { name: "Remada Curvada", sets: 4, reps: 8, weight: 0 },
      { name: "Puxada Frontal", sets: 3, reps: 10, weight: 0 },
      { name: "Remada Unilateral", sets: 3, reps: 10, weight: 0 },
      { name: "Rosca Direta", sets: 3, reps: 12, weight: 0 },
      { name: "Rosca Martelo", sets: 3, reps: 12, weight: 0 },
    ],
  },
  {
    id: "legs",
    name: "Legs (Pernas)",
    description: "Pernas e Glúteos",
    category: "Push/Pull/Legs",
    isDefault: true,
    exercises: [
      { name: "Agachamento", sets: 4, reps: 8, weight: 0 },
      { name: "Leg Press", sets: 4, reps: 10, weight: 0 },
      { name: "Extensão de Pernas", sets: 3, reps: 12, weight: 0 },
      { name: "Flexão de Pernas", sets: 3, reps: 12, weight: 0 },
      { name: "Stiff", sets: 3, reps: 10, weight: 0 },
      { name: "Elevação Pélvica", sets: 3, reps: 12, weight: 0 },
    ],
  },
  {
    id: "fullbody",
    name: "Full Body",
    description: "Treino completo do corpo",
    category: "Full Body",
    isDefault: true,
    exercises: [
      { name: "Agachamento", sets: 3, reps: 10, weight: 0 },
      { name: "Supino Reto", sets: 3, reps: 10, weight: 0 },
      { name: "Remada Curvada", sets: 3, reps: 10, weight: 0 },
      { name: "Desenvolvimento", sets: 3, reps: 10, weight: 0 },
      { name: "Rosca Direta", sets: 3, reps: 12, weight: 0 },
      { name: "Tríceps Pulley", sets: 3, reps: 12, weight: 0 },
      { name: "Prancha", sets: 3, reps: 60, weight: 0 },
    ],
  },
  {
    id: "upper",
    name: "Upper Body",
    description: "Torso completo",
    category: "Upper/Lower",
    isDefault: true,
    exercises: [
      { name: "Supino Reto", sets: 4, reps: 8, weight: 0 },
      { name: "Supino Inclinado", sets: 3, reps: 10, weight: 0 },
      { name: "Remada Curvada", sets: 4, reps: 8, weight: 0 },
      { name: "Puxada Frontal", sets: 3, reps: 10, weight: 0 },
      { name: "Desenvolvimento", sets: 3, reps: 10, weight: 0 },
      { name: "Rosca Direta", sets: 3, reps: 12, weight: 0 },
      { name: "Tríceps Pulley", sets: 3, reps: 12, weight: 0 },
    ],
  },
  {
    id: "lower",
    name: "Lower Body",
    description: "Pernas e Glúteos",
    category: "Upper/Lower",
    isDefault: true,
    exercises: [
      { name: "Agachamento", sets: 4, reps: 8, weight: 0 },
      { name: "Leg Press", sets: 4, reps: 10, weight: 0 },
      { name: "Stiff", sets: 3, reps: 10, weight: 0 },
      { name: "Extensão de Pernas", sets: 3, reps: 12, weight: 0 },
      { name: "Flexão de Pernas", sets: 3, reps: 12, weight: 0 },
      { name: "Elevação Pélvica", sets: 3, reps: 12, weight: 0 },
      { name: "Panturrilha", sets: 4, reps: 15, weight: 0 },
    ],
  },
];

const STORAGE_KEY = "templates";

const getTemplatesFromStorage = (): Template[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Erro ao carregar templates:", error);
    return [];
  }
};

const saveTemplatesToStorage = (templates: Template[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
  } catch (error) {
    console.error("Erro ao salvar templates:", error);
  }
};

export const templatesService = {
  // Obter todos os templates (defaults + personalizados)
  getTemplates: (userId?: string): Template[] => {
    const customTemplates = getTemplatesFromStorage().filter(
      (t) => !t.isDefault && (!userId || t.userId === userId)
    );
    return [...defaultTemplates, ...customTemplates];
  },

  // Obter template por ID
  getTemplate: (id: string, userId?: string): Template | null => {
    const defaultTemplate = defaultTemplates.find((t) => t.id === id);
    if (defaultTemplate) return defaultTemplate;

    const customTemplates = getTemplatesFromStorage();
    const template = customTemplates.find(
      (t) => t.id === id && (!userId || t.userId === userId)
    );
    return template || null;
  },

  // Criar template personalizado
  createTemplate: (template: Omit<Template, "id" | "isDefault">, userId: string): Template => {
    const templates = getTemplatesFromStorage();
    const newTemplate: Template = {
      ...template,
      id: Date.now().toString(),
      isDefault: false,
      userId,
      category: template.category || "Personalizado",
    };

    templates.push(newTemplate);
    saveTemplatesToStorage(templates);
    return newTemplate;
  },

  // Atualizar template personalizado
  updateTemplate: (id: string, updates: Partial<Template>, userId: string): Template | null => {
    const templates = getTemplatesFromStorage();
    const index = templates.findIndex((t) => t.id === id && t.userId === userId);

    if (index === -1) return null;

    templates[index] = { ...templates[index], ...updates };
    saveTemplatesToStorage(templates);
    return templates[index];
  },

  // Deletar template personalizado
  deleteTemplate: (id: string, userId: string): boolean => {
    const templates = getTemplatesFromStorage();
    const filtered = templates.filter((t) => !(t.id === id && t.userId === userId));

    if (filtered.length === templates.length) return false;

    saveTemplatesToStorage(filtered);
    return true;
  },

  // Obter templates por categoria
  getByCategory: (category: Template["category"], userId?: string): Template[] => {
    return templatesService.getTemplates(userId).filter((t) => t.category === category);
  },
};

