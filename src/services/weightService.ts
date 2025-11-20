import { supabase } from "@/config/supabase";
import { supabaseService } from "./supabaseService";

export interface UserWeight {
  id: string;
  user_id: string;
  weight: number;
  body_fat_percentage?: number;
  muscle_mass?: number;
  notes?: string;
  created_at: string;
}

export interface WeightStats {
  total_records: number;
  min_weight: number;
  max_weight: number;
  avg_weight: number;
  latest_weight: number;
  first_weight: number;
  last_recorded_at: string;
  first_recorded_at: string;
  weight_change?: number;
}

class WeightService {
  // Adicionar registro de peso
  async addWeight(
    userId: string,
    weight: number,
    bodyFat?: number,
    muscleMass?: number,
    notes?: string
  ): Promise<UserWeight> {
    if (!supabaseService.isConfigured() || !supabase) {
      return this.addWeightLocalStorage(userId, weight, bodyFat, muscleMass, notes);
    }

    try {
      const { data, error } = await supabase
        .from('user_weights')
        .insert({
          user_id: userId.toString(),
          weight: weight,
          body_fat_percentage: bodyFat,
          muscle_mass: muscleMass,
          notes: notes,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao adicionar peso:', error);
      throw error;
    }
  }

  // Buscar todos os registros de peso do usuário
  async getWeights(userId: string, limit?: number): Promise<UserWeight[]> {
    if (!supabaseService.isConfigured() || !supabase) {
      return this.getWeightsLocalStorage(userId);
    }

    try {
      let query = supabase
        .from('user_weights')
        .select('*')
        .eq('user_id', userId.toString())
        .order('created_at', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar pesos:', error);
      return this.getWeightsLocalStorage(userId);
    }
  }

  // Buscar estatísticas de peso
  async getWeightStats(userId: string): Promise<WeightStats | null> {
    if (!supabaseService.isConfigured() || !supabase) {
      return this.getWeightStatsLocalStorage(userId);
    }

    try {
      const { data, error } = await supabase
        .from('user_weight_stats')
        .select('*')
        .eq('user_id', userId.toString())
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        return null;
      }

      // Calcular mudança de peso
      const weightChange = data.latest_weight && data.first_weight
        ? data.latest_weight - data.first_weight
        : undefined;

      return {
        ...data,
        weight_change: weightChange,
      };
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      return this.getWeightStatsLocalStorage(userId);
    }
  }

  // Atualizar registro de peso
  async updateWeight(
    weightId: string,
    weight: number,
    bodyFat?: number,
    muscleMass?: number,
    notes?: string
  ): Promise<UserWeight> {
    if (!supabaseService.isConfigured() || !supabase) {
      throw new Error('Supabase não configurado');
    }

    try {
      const { data, error } = await supabase
        .from('user_weights')
        .update({
          weight: weight,
          body_fat_percentage: bodyFat,
          muscle_mass: muscleMass,
          notes: notes,
        })
        .eq('id', weightId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao atualizar peso:', error);
      throw error;
    }
  }

  // Deletar registro de peso
  async deleteWeight(weightId: string): Promise<void> {
    if (!supabaseService.isConfigured() || !supabase) {
      throw new Error('Supabase não configurado');
    }

    try {
      const { error } = await supabase
        .from('user_weights')
        .delete()
        .eq('id', weightId);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao deletar peso:', error);
      throw error;
    }
  }

  // LocalStorage fallback
  private addWeightLocalStorage(
    userId: string,
    weight: number,
    bodyFat?: number,
    muscleMass?: number,
    notes?: string
  ): UserWeight {
    const weightRecord: UserWeight = {
      id: Date.now().toString(),
      user_id: userId,
      weight: weight,
      body_fat_percentage: bodyFat,
      muscle_mass: muscleMass,
      notes: notes,
      created_at: new Date().toISOString(),
    };

    try {
      const stored = localStorage.getItem(`weights_${userId}`);
      const weights: UserWeight[] = stored ? JSON.parse(stored) : [];
      weights.unshift(weightRecord);
      localStorage.setItem(`weights_${userId}`, JSON.stringify(weights));
    } catch (error) {
      console.error('Erro ao salvar peso no localStorage:', error);
    }

    return weightRecord;
  }

  private getWeightsLocalStorage(userId: string): UserWeight[] {
    try {
      const stored = localStorage.getItem(`weights_${userId}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private getWeightStatsLocalStorage(userId: string): WeightStats | null {
    const weights = this.getWeightsLocalStorage(userId);
    if (weights.length === 0) return null;

    const weightValues = weights.map(w => w.weight);
    return {
      total_records: weights.length,
      min_weight: Math.min(...weightValues),
      max_weight: Math.max(...weightValues),
      avg_weight: weightValues.reduce((a, b) => a + b, 0) / weightValues.length,
      latest_weight: weights[0]?.weight || 0,
      first_weight: weights[weights.length - 1]?.weight || 0,
      last_recorded_at: weights[0]?.created_at || '',
      first_recorded_at: weights[weights.length - 1]?.created_at || '',
      weight_change: weights[0]?.weight && weights[weights.length - 1]?.weight
        ? weights[0].weight - weights[weights.length - 1].weight
        : undefined,
    };
  }
}

export const weightService = new WeightService();

