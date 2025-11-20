export interface ExerciseData {
  id: string;
  name: string;
  category: string;
  muscleGroups: string[];
  equipment?: string[];
}

export const exerciseCategories = [
  "Peito",
  "Costas",
  "Ombro",
  "Bíceps",
  "Tríceps",
  "Pernas",
  "Glúteos",
  "Abdômen",
  "Cardio",
  "Outros",
] as const;

export type ExerciseCategory = typeof exerciseCategories[number];

// Banco de exercícios pré-cadastrados
export const exercisesDatabase: ExerciseData[] = [
  // PEITO
  { id: "1", name: "Supino Reto", category: "Peito", muscleGroups: ["Peitoral Maior"], equipment: ["Barra", "Halteres"] },
  { id: "2", name: "Supino Inclinado", category: "Peito", muscleGroups: ["Peitoral Superior"] },
  { id: "3", name: "Supino Declinado", category: "Peito", muscleGroups: ["Peitoral Inferior"] },
  { id: "4", name: "Supino com Halteres", category: "Peito", muscleGroups: ["Peitoral Maior"] },
  { id: "5", name: "Crucifixo", category: "Peito", muscleGroups: ["Peitoral Maior"] },
  { id: "6", name: "Peck Deck", category: "Peito", muscleGroups: ["Peitoral Maior"] },
  { id: "7", name: "Flexão", category: "Peito", muscleGroups: ["Peitoral Maior", "Tríceps"] },
  { id: "8", name: "Flexão Inclinada", category: "Peito", muscleGroups: ["Peitoral Maior"] },
  { id: "9", name: "Crossover", category: "Peito", muscleGroups: ["Peitoral Maior"] },

  // COSTAS
  { id: "10", name: "Barra Fixa", category: "Costas", muscleGroups: ["Latíssimo", "Bíceps"] },
  { id: "11", name: "Remada Curvada", category: "Costas", muscleGroups: ["Dorsais", "Romboides"] },
  { id: "12", name: "Remada Unilateral", category: "Costas", muscleGroups: ["Dorsais"] },
  { id: "13", name: "Puxada Frontal", category: "Costas", muscleGroups: ["Latíssimo"] },
  { id: "14", name: "Puxada Atrás", category: "Costas", muscleGroups: ["Latíssimo", "Romboides"] },
  { id: "15", name: "Remada Alta", category: "Costas", muscleGroups: ["Trapézio", "Deltóides"] },
  { id: "16", name: "Serrote", category: "Costas", muscleGroups: ["Serrátil"] },
  { id: "17", name: "Remada no Smith", category: "Costas", muscleGroups: ["Dorsais"] },
  { id: "18", name: "Puxada com Triângulo", category: "Costas", muscleGroups: ["Latíssimo"] },

  // OMBRO
  { id: "19", name: "Desenvolvimento", category: "Ombro", muscleGroups: ["Deltóide Anterior"] },
  { id: "20", name: "Elevação Lateral", category: "Ombro", muscleGroups: ["Deltóide Lateral"] },
  { id: "21", name: "Elevação Frontal", category: "Ombro", muscleGroups: ["Deltóide Anterior"] },
  { id: "22", name: "Crucifixo Invertido", category: "Ombro", muscleGroups: ["Deltóide Posterior"] },
  { id: "23", name: "Desenvolvimento com Halteres", category: "Ombro", muscleGroups: ["Deltóides"] },
  { id: "24", name: "Elevação Arnold", category: "Ombro", muscleGroups: ["Deltóides"] },
  { id: "25", name: "Encolhimento", category: "Ombro", muscleGroups: ["Trapézio"] },

  // BÍCEPS
  { id: "26", name: "Rosca Direta", category: "Bíceps", muscleGroups: ["Bíceps Braquial"] },
  { id: "27", name: "Rosca Alternada", category: "Bíceps", muscleGroups: ["Bíceps Braquial"] },
  { id: "28", name: "Rosca Martelo", category: "Bíceps", muscleGroups: ["Bíceps", "Antebraço"] },
  { id: "29", name: "Rosca Concentrada", category: "Bíceps", muscleGroups: ["Bíceps Braquial"] },
  { id: "30", name: "Rosca Scott", category: "Bíceps", muscleGroups: ["Bíceps Braquial"] },
  { id: "31", name: "Rosca 21", category: "Bíceps", muscleGroups: ["Bíceps Braquial"] },

  // TRÍCEPS
  { id: "32", name: "Tríceps Pulley", category: "Tríceps", muscleGroups: ["Tríceps"] },
  { id: "33", name: "Tríceps Testa", category: "Tríceps", muscleGroups: ["Tríceps"] },
  { id: "34", name: "Tríceps Coice", category: "Tríceps", muscleGroups: ["Tríceps"] },
  { id: "35", name: "Paralelas", category: "Tríceps", muscleGroups: ["Tríceps", "Peito"] },
  { id: "36", name: "Mergulho", category: "Tríceps", muscleGroups: ["Tríceps", "Peito"] },
  { id: "37", name: "Tríceps Francês", category: "Tríceps", muscleGroups: ["Tríceps"] },

  // PERNAS
  { id: "38", name: "Agachamento", category: "Pernas", muscleGroups: ["Quadríceps", "Glúteos"] },
  { id: "39", name: "Agachamento Livre", category: "Pernas", muscleGroups: ["Quadríceps", "Glúteos"] },
  { id: "40", name: "Leg Press", category: "Pernas", muscleGroups: ["Quadríceps", "Glúteos"] },
  { id: "41", name: "Extensão de Pernas", category: "Pernas", muscleGroups: ["Quadríceps"] },
  { id: "42", name: "Flexão de Pernas", category: "Pernas", muscleGroups: ["Posterior de Coxa"] },
  { id: "43", name: "Afundo", category: "Pernas", muscleGroups: ["Quadríceps", "Glúteos"] },
  { id: "44", name: "Agachamento Búlgaro", category: "Pernas", muscleGroups: ["Quadríceps", "Glúteos"] },
  { id: "45", name: "Hack Squat", category: "Pernas", muscleGroups: ["Quadríceps", "Glúteos"] },

  // GLÚTEOS
  { id: "46", name: "Elevação Pélvica", category: "Glúteos", muscleGroups: ["Glúteos"] },
  { id: "47", name: "Abdução de Quadril", category: "Glúteos", muscleGroups: ["Glúteos"] },
  { id: "48", name: "Stiff", category: "Glúteos", muscleGroups: ["Glúteos", "Posterior de Coxa"] },
  { id: "49", name: "Stiff com Halteres", category: "Glúteos", muscleGroups: ["Glúteos", "Posterior de Coxa"] },
  { id: "50", name: "Agachamento Sumô", category: "Glúteos", muscleGroups: ["Glúteos", "Adutores"] },

  // ABDÔMEN
  { id: "51", name: "Abdominal Crunch", category: "Abdômen", muscleGroups: ["Reto Abdominal"] },
  { id: "52", name: "Prancha", category: "Abdômen", muscleGroups: ["Core"] },
  { id: "53", name: "Abdominal Infra", category: "Abdômen", muscleGroups: ["Reto Abdominal"] },
  { id: "54", name: "Abdominal Oblíquo", category: "Abdômen", muscleGroups: ["Oblíquos"] },
  { id: "55", name: "Mountain Climber", category: "Abdômen", muscleGroups: ["Core"] },
  { id: "56", name: "Russian Twist", category: "Abdômen", muscleGroups: ["Oblíquos"] },

  // CARDIO
  { id: "57", name: "Esteira", category: "Cardio", muscleGroups: [] },
  { id: "58", name: "Bicicleta Ergométrica", category: "Cardio", muscleGroups: [] },
  { id: "59", name: "Elíptico", category: "Cardio", muscleGroups: [] },
  { id: "60", name: "Burpee", category: "Cardio", muscleGroups: ["Corpo Inteiro"] },
];

export const exercisesService = {
  // Buscar exercícios por nome (busca parcial)
  searchExercises: (query: string): ExerciseData[] => {
    if (!query.trim()) return [];
    const lowerQuery = query.toLowerCase();
    return exercisesDatabase.filter(
      (ex) => ex.name.toLowerCase().includes(lowerQuery)
    );
  },

  // Obter exercícios por categoria
  getByCategory: (category: ExerciseCategory): ExerciseData[] => {
    return exercisesDatabase.filter((ex) => ex.category === category);
  },

  // Obter exercício por nome exato
  getByName: (name: string): ExerciseData | undefined => {
    return exercisesDatabase.find(
      (ex) => ex.name.toLowerCase() === name.toLowerCase()
    );
  },

  // Obter todas as categorias
  getCategories: (): ExerciseCategory[] => {
    return [...exerciseCategories];
  },

  // Obter exercícios mais populares (baseado em uso comum)
  getPopular: (limit: number = 10): ExerciseData[] => {
    const popularIds = [
      "38", "1", "11", "19", "26", "32", "40", "48", "10", "7"
    ];
    return popularIds
      .slice(0, limit)
      .map((id) => exercisesDatabase.find((ex) => ex.id === id))
      .filter((ex): ex is ExerciseData => ex !== undefined);
  },

  // Obter todos os exercícios
  getAll: (): ExerciseData[] => {
    return exercisesDatabase;
  },
};

