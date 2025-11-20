// Serviço de integração com Supabase
// ⚠️ SEGURANÇA: Usa apenas anon key, nunca service role key

import { supabase } from "@/config/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

class SupabaseService {
  private isOnline: boolean = true;

  constructor() {
    this.checkConnection();
    // Monitorar mudanças de conexão
    window.addEventListener("online", () => {
      this.isOnline = true;
      this.syncPending();
    });
    window.addEventListener("offline", () => {
      this.isOnline = false;
    });
  }

  // Verificar status de conexão
  checkConnection(): boolean {
    this.isOnline = navigator.onLine;
    return this.isOnline;
  }

  // Verificar se está online
  getIsOnline(): boolean {
    return this.isOnline;
  }

  // Verificar se Supabase está configurado
  isConfigured(): boolean {
    return supabase !== null;
  }

  // Obter dados (com fallback para localStorage)
  async getData<T>(table: string, userId: string): Promise<T[]> {
    if (supabase && this.isOnline) {
      try {
        console.log(`📥 Buscando ${table} para userId:`, userId);
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (error) {
          console.error(`❌ Erro ao buscar ${table}:`, error);
          console.error(`Detalhes do erro:`, {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint,
          });
          // Fallback para localStorage em caso de erro
          return this.getDataFromLocalStorage<T>(table, userId);
        }

        console.log(`✅ Dados de ${table} obtidos:`, data?.length || 0, 'registros');
        
        // Salvar no localStorage como cache
        if (data) {
          localStorage.setItem(`supabase_${table}_${userId}`, JSON.stringify(data));
        }

        return data || [];
      } catch (error) {
        console.error(`❌ Exceção ao buscar ${table}:`, error);
        return this.getDataFromLocalStorage<T>(table, userId);
      }
    }

    console.log(`⚠️ Supabase offline/não configurado, usando localStorage para ${table}`);
    // Fallback para localStorage
    return this.getDataFromLocalStorage<T>(table, userId);
  }

  // Obter dados do localStorage
  private getDataFromLocalStorage<T>(table: string, userId: string): T[] {
    try {
      const stored = localStorage.getItem(`supabase_${table}_${userId}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  // Salvar dados (com sincronização pendente se offline)
  async saveData<T extends { id?: string; user_id: string }>(
    table: string,
    userId: string,
    data: T | T[]
  ): Promise<T | T[] | null> {
    const dataArray = Array.isArray(data) ? data : [data];
    
    // CORREÇÃO: Substituir dados ao invés de acumular
    // Isso evita duplicação e estouro do localStorage
    localStorage.setItem(`supabase_${table}_${userId}`, JSON.stringify(dataArray));

    if (supabase && this.isOnline) {
      try {
        console.log(`💾 Salvando em ${table}:`, dataArray);
        
        // Garantir que user_id está correto e remover campos camelCase
        const dataWithUserId = dataArray.map(item => {
          const cleaned: any = {
            ...item,
            user_id: userId,
          };
          
          // Remover campos camelCase que não existem na tabela
          // O Supabase usa snake_case
          delete cleaned.userId;
          delete cleaned.badgeId;
          delete cleaned.unlockedAt;
          delete cleaned.createdAt;
          delete cleaned.updatedAt;
          delete cleaned.created_at; // Não enviar - tabela tem DEFAULT NOW()
          delete cleaned.updated_at; // Não enviar - tabela tem DEFAULT NOW()
          
          return cleaned;
        });

        console.log(`📤 Enviando para Supabase:`, dataWithUserId);

        const { data: savedData, error } = await supabase
          .from(table)
          .upsert(dataWithUserId, { onConflict: 'id' })
          .select();

        if (error) {
          console.error(`❌ Erro ao salvar ${table}:`, error);
          console.error(`Detalhes:`, {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint,
          });
          // Marcar para sincronizar depois
          this.markForSync(table, userId);
          return Array.isArray(data) ? dataArray : data;
        }

        console.log(`✅ Dados salvos em ${table}:`, savedData);
        return savedData as T | T[];
      } catch (error) {
        console.error(`❌ Exceção ao salvar ${table}:`, error);
        this.markForSync(table, userId);
        return Array.isArray(data) ? dataArray : data;
      }
    } else {
      console.log(`⚠️ Offline: marcando ${table} para sincronização posterior`);
      // Se offline, marcar para sincronizar depois
      this.markForSync(table, userId);
      return Array.isArray(data) ? dataArray : data;
    }
  }

  // Deletar dados
  async deleteData(table: string, id: string, userId: string): Promise<boolean> {
    // Remover do localStorage
    const existing = this.getDataFromLocalStorage<any>(table, userId);
    const filtered = existing.filter((item: any) => item.id !== id);
    localStorage.setItem(`supabase_${table}_${userId}`, JSON.stringify(filtered));

    if (supabase && this.isOnline) {
      try {
        const { error } = await supabase
          .from(table)
          .delete()
          .eq('id', id)
          .eq('user_id', userId); // Segurança: garantir que é do usuário

        if (error) {
          console.error(`Erro ao deletar ${table}:`, error);
          this.markForSync(table, userId);
          return false;
        }

        return true;
      } catch (error) {
        console.error(`Erro ao deletar ${table}:`, error);
        this.markForSync(table, userId);
        return false;
      }
    }

    this.markForSync(table, userId);
    return true;
  }

  // Marcar dados para sincronização
  private markForSync(table: string, userId: string) {
    const pending = this.getPendingSync();
    const key = `${table}_${userId}`;
    if (!pending.includes(key)) {
      pending.push(key);
      localStorage.setItem("supabase_pending_sync", JSON.stringify(pending));
    }
  }

  // Obter lista de sincronizações pendentes
  getPendingSync(): string[] {
    try {
      const stored = localStorage.getItem("supabase_pending_sync");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  // Sincronizar dados pendentes (chamar quando voltar online)
  async syncPending(): Promise<void> {
    if (!supabase || !this.isOnline) return;

    const pending = this.getPendingSync();
    for (const key of pending) {
      const [table, userId] = key.split("_");
      try {
        const localData = this.getDataFromLocalStorage<any>(table, userId);
        if (localData.length > 0) {
          await this.saveData(table, userId, localData);
        }
      } catch (error) {
        console.error(`Erro ao sincronizar ${table}:`, error);
      }
    }

    localStorage.removeItem("supabase_pending_sync");
  }
}

export const supabaseService = new SupabaseService();

