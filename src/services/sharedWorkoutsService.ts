// Serviço para Treinos Compartilhados
import { supabase } from "@/config/supabase";

export interface Exercise {
  name: string;
  sets: number;
  reps: number;
  weight: number;
  notes?: string;
}

export interface SharedWorkout {
  id: string;
  group_id: string;
  creator_id: string;
  creator_name: string;
  creator_avatar_url?: string;
  title: string;
  description?: string;
  workout_type: 'musculacao' | 'cardio' | 'yoga' | 'outro';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimated_duration?: number;
  exercises: Exercise[];
  times_completed: number;
  participants_count: number;
  created_at: string;
  updated_at: string;
}

export interface WorkoutParticipation {
  id: string;
  shared_workout_id: string;
  user_id: string;
  user_name: string;
  user_avatar_url?: string;
  status: 'in_progress' | 'completed' | 'abandoned';
  completed_exercises: number[]; // índices dos exercícios completados
  duration_minutes?: number;
  notes?: string;
  photo_url?: string;
  started_at: string;
  completed_at?: string;
}

export const sharedWorkoutsService = {
  // Buscar treinos compartilhados de um grupo
  async getGroupWorkouts(groupId: string): Promise<SharedWorkout[]> {
    if (!supabase) throw new Error("Supabase não configurado");

    const { data, error } = await supabase
      .from("shared_workouts")
      .select("*")
      .eq("group_id", groupId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Criar treino compartilhado
  async createSharedWorkout(workout: Omit<SharedWorkout, 'id' | 'times_completed' | 'participants_count' | 'created_at' | 'updated_at'>): Promise<SharedWorkout> {
    if (!supabase) throw new Error("Supabase não configurado");

    const { data, error } = await supabase
      .from("shared_workouts")
      .insert({
        id: Date.now().toString(),
        ...workout,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Deletar treino compartilhado
  async deleteSharedWorkout(workoutId: string): Promise<void> {
    if (!supabase) throw new Error("Supabase não configurado");

    const { error } = await supabase
      .from("shared_workouts")
      .delete()
      .eq("id", workoutId);

    if (error) throw error;
  },

  // Começar a participar de um treino
  async startWorkout(workoutId: string, userId: string, userName: string, userAvatarUrl?: string): Promise<WorkoutParticipation> {
    if (!supabase) throw new Error("Supabase não configurado");

    const { data, error } = await supabase
      .from("workout_participations")
      .insert({
        shared_workout_id: workoutId,
        user_id: userId,
        user_name: userName,
        user_avatar_url: userAvatarUrl,
        status: 'in_progress',
        completed_exercises: [],
      })
      .select()
      .single();

    if (error) {
      // Se já existe, buscar
      if (error.code === '23505') {
        return await this.getParticipation(workoutId, userId);
      }
      throw error;
    }

    return data;
  },

  // Buscar participação de um usuário em um treino
  async getParticipation(workoutId: string, userId: string): Promise<WorkoutParticipation> {
    if (!supabase) throw new Error("Supabase não configurado");

    const { data, error } = await supabase
      .from("workout_participations")
      .select("*")
      .eq("shared_workout_id", workoutId)
      .eq("user_id", userId)
      .single();

    if (error) throw error;
    return data;
  },

  // Marcar exercício como concluído
  async toggleExerciseComplete(participationId: string, exerciseIndex: number, currentCompleted: number[]): Promise<void> {
    if (!supabase) throw new Error("Supabase não configurado");

    const isCompleted = currentCompleted.includes(exerciseIndex);
    const newCompleted = isCompleted
      ? currentCompleted.filter((i) => i !== exerciseIndex)
      : [...currentCompleted, exerciseIndex];

    const { error } = await supabase
      .from("workout_participations")
      .update({ completed_exercises: newCompleted })
      .eq("id", participationId);

    if (error) throw error;
  },

  // Completar treino
  async completeWorkout(participationId: string, durationMinutes: number, notes?: string, photoUrl?: string): Promise<void> {
    if (!supabase) throw new Error("Supabase não configurado");

    const { error } = await supabase
      .from("workout_participations")
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        duration_minutes: durationMinutes,
        notes,
        photo_url: photoUrl,
      })
      .eq("id", participationId);

    if (error) throw error;
  },

  // Buscar todas as participações de um treino
  async getWorkoutParticipations(workoutId: string): Promise<WorkoutParticipation[]> {
    if (!supabase) throw new Error("Supabase não configurado");

    const { data, error } = await supabase
      .from("workout_participations")
      .select("*")
      .eq("shared_workout_id", workoutId)
      .order("started_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Formatar dificuldade
  formatDifficulty(difficulty: string): string {
    const map: Record<string, string> = {
      beginner: "Iniciante",
      intermediate: "Intermediário",
      advanced: "Avançado",
    };
    return map[difficulty] || difficulty;
  },

  // Calcular progresso
  calculateProgress(completedExercises: number[], totalExercises: number): number {
    if (totalExercises === 0) return 0;
    return Math.round((completedExercises.length / totalExercises) * 100);
  },
};

