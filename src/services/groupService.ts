// Serviço para gerenciar grupos e desafios
// ⚠️ SEGURANÇA: Conectado ao Supabase com fallback para localStorage

import { supabase } from "@/config/supabase";
import { supabaseService } from "./supabaseService";

// Função auxiliar para gerar código único
const generateUniqueInviteCode = async (): Promise<string> => {
  let code: string;
  let isUnique = false;
  let attempts = 0;
  const maxAttempts = 20;

  while (!isUnique && attempts < maxAttempts) {
    code = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    if (supabaseService.isConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from("groups")
          .select("id")
          .eq("invite_code", code)
          .maybeSingle();
        
        if (!data && error?.code !== "PGRST116") {
          // Se não encontrou e não é erro de "não encontrado", tentar novamente
          attempts++;
          continue;
        }
        
        // Se não encontrou nenhum grupo com esse código, é único
        isUnique = true;
      } catch (error) {
        // Em caso de erro, assumir que é único após algumas tentativas
        if (attempts > 5) {
          isUnique = true;
        } else {
          attempts++;
        }
      }
    } else {
      // Fallback: verificar no localStorage
      try {
        const stored = localStorage.getItem("groups");
        const groups = stored ? JSON.parse(stored) : [];
        const exists = groups.some((g: Group) => g.invite_code === code);
        if (!exists) {
          isUnique = true;
        } else {
          attempts++;
        }
      } catch {
        isUnique = true;
      }
    }
    
    if (!isUnique) {
      attempts++;
    }
  }

  return code || Math.random().toString(36).substring(2, 8).toUpperCase();
};

export interface Group {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  owner_name: string;
  is_public: boolean;
  invite_code?: string;
  created_at: string;
  updated_at?: string;
  member_count?: number;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  user_name: string;
  role: "owner" | "admin" | "member";
  joined_at: string;
  total_points?: number;
}

export interface Challenge {
  id: string;
  group_id: string;
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  created_by: string;
  created_by_name: string;
  is_active: boolean;
  created_at: string;
  participant_count?: number;
}

export interface ChallengeParticipant {
  id: string;
  challenge_id: string;
  user_id: string;
  user_name: string;
  joined_at: string;
  total_points: number;
  rank?: number;
}

export interface QuickWorkout {
  id: string;
  user_id: string;
  user_name: string;
  activity_type: string;
  activity_name: string;
  duration_minutes: number;
  date: string;
  points: number;
  challenge_ids?: string[]; // IDs dos desafios em que participa
  created_at: string;
  start_time?: string; // Horário de início (HH:MM)
  duration_hours?: number;
  duration_minutes_detailed?: number;
  duration_seconds?: number;
  photo_url?: string;
}

const GROUPS_KEY = "groups";
const GROUP_MEMBERS_KEY = "group_members";
const CHALLENGES_KEY = "challenges";
const CHALLENGE_PARTICIPANTS_KEY = "challenge_participants";
const QUICK_WORKOUTS_KEY = "quick_workouts";

// Funções de fallback para localStorage
const getFromStorage = <T>(key: string, userId?: string): T[] => {
  try {
    const stored = localStorage.getItem(userId ? `${key}_${userId}` : key);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveToStorage = <T>(key: string, data: T[], userId?: string): void => {
  try {
    localStorage.setItem(userId ? `${key}_${userId}` : key, JSON.stringify(data));
  } catch {
    console.error(`Erro ao salvar ${key}`);
  }
};

export const groupService = {
  // ========== GRUPOS ==========
  
  createGroup: async (
    userId: string,
    userName: string,
    name: string,
    description?: string,
    isPublic: boolean = false
  ): Promise<Group> => {
    const inviteCode = await generateUniqueInviteCode();

    const group: Group = {
      id: Date.now().toString(),
      name,
      description,
      owner_id: userId,
      owner_name: userName,
      is_public: isPublic,
      invite_code: inviteCode,
      created_at: new Date().toISOString(),
      member_count: 1,
    };

    // Salvar no Supabase
    if (supabaseService.isConfigured() && supabase) {
      try {
        const { error } = await supabase.from("groups").insert({
          id: group.id,
          name: group.name,
          description: group.description,
          owner_id: group.owner_id,
          owner_name: group.owner_name,
          is_public: group.is_public,
          invite_code: group.invite_code,
          created_at: group.created_at,
        });

        if (error) throw error;

        // Adicionar owner como membro (deve ser feito imediatamente)
        try {
          await groupService.addMember(group.id, userId, userName, "owner");
        } catch (memberError) {
          console.error("Erro ao adicionar owner como membro:", memberError);
          // Continuar mesmo se houver erro ao adicionar membro
        }
      } catch (error) {
        console.error("Erro ao criar grupo no Supabase:", error);
        const groups = getFromStorage<Group>(GROUPS_KEY);
        groups.push(group);
        saveToStorage(GROUPS_KEY, groups);
      }
    } else {
      const groups = getFromStorage<Group>(GROUPS_KEY);
      groups.push(group);
      saveToStorage(GROUPS_KEY, groups);
    }

    return group;
  },

  getGroups: async (userId: string): Promise<Group[]> => {
    if (supabaseService.isConfigured() && supabase) {
      try {
        // Buscar grupos onde o usuário é membro OU é owner
        const { data: members, error: membersError } = await supabase
          .from("group_members")
          .select("group_id")
          .eq("user_id", userId);

        if (membersError) throw membersError;

        // Também buscar grupos onde o usuário é owner
        const { data: ownedGroups, error: ownedError } = await supabase
          .from("groups")
          .select("id")
          .eq("owner_id", userId);

        if (ownedError) throw ownedError;

        const memberGroupIds = members?.map((m) => m.group_id) || [];
        const ownedGroupIds = ownedGroups?.map((g) => g.id) || [];
        
        // Combinar IDs únicos
        const allGroupIds = [...new Set([...memberGroupIds, ...ownedGroupIds])];

        if (allGroupIds.length === 0) return [];

        const { data: groups, error: groupsError } = await supabase
          .from("groups")
          .select("*")
          .in("id", allGroupIds)
          .order("created_at", { ascending: false });

        if (groupsError) throw groupsError;

        return groups || [];
      } catch (error) {
        console.error("Erro ao buscar grupos do Supabase:", error);
      }
    }

    // Fallback
    const allGroups = getFromStorage<Group>(GROUPS_KEY);
    return allGroups.filter((g) => g.owner_id === userId || 
      getFromStorage<GroupMember>(GROUP_MEMBERS_KEY).some((m) => 
        m.group_id === g.id && m.user_id === userId
      )
    );
  },

  getGroupById: async (groupId: string): Promise<Group | null> => {
    if (supabaseService.isConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from("groups")
          .select("*")
          .eq("id", groupId)
          .single();

        if (!error && data) return data;
      } catch (error) {
        console.error("Erro ao buscar grupo:", error);
      }
    }

    const groups = getFromStorage<Group>(GROUPS_KEY);
    return groups.find((g) => g.id === groupId) || null;
  },

  joinGroupByCode: async (
    inviteCode: string,
    userId: string,
    userName: string
  ): Promise<Group | null> => {
    if (supabaseService.isConfigured() && supabase) {
      try {
        const { data: group, error } = await supabase
          .from("groups")
          .select("*")
          .eq("invite_code", inviteCode)
          .single();

        if (error || !group) return null;

        await groupService.addMember(group.id, userId, userName, "member");
        return group;
      } catch (error) {
        console.error("Erro ao entrar no grupo:", error);
      }
    }

    // Fallback
    const groups = getFromStorage<Group>(GROUPS_KEY);
    const group = groups.find((g) => g.invite_code === inviteCode);
    if (group) {
      await groupService.addMember(group.id, userId, userName, "member");
      return group;
    }

    return null;
  },

  addMember: async (
    groupId: string,
    userId: string,
    userName: string,
    role: GroupMember["role"] = "member"
  ): Promise<GroupMember> => {
    const member: GroupMember = {
      id: Date.now().toString(),
      group_id: groupId,
      user_id: userId,
      user_name: userName,
      role,
      joined_at: new Date().toISOString(),
      total_points: 0,
    };

    if (supabaseService.isConfigured() && supabase) {
      try {
        const { error } = await supabase.from("group_members").insert({
          id: member.id,
          group_id: member.group_id,
          user_id: member.user_id,
          user_name: member.user_name,
          role: member.role,
          joined_at: member.joined_at,
          total_points: member.total_points,
        });

        if (error) throw error;
      } catch (error) {
        console.error("Erro ao adicionar membro:", error);
        const members = getFromStorage<GroupMember>(GROUP_MEMBERS_KEY);
        members.push(member);
        saveToStorage(GROUP_MEMBERS_KEY, members);
      }
    } else {
      const members = getFromStorage<GroupMember>(GROUP_MEMBERS_KEY);
      members.push(member);
      saveToStorage(GROUP_MEMBERS_KEY, members);
    }

    return member;
  },

  getGroupMembers: async (groupId: string): Promise<GroupMember[]> => {
    if (supabaseService.isConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from("group_members")
          .select("*")
          .eq("group_id", groupId)
          .order("total_points", { ascending: false });

        if (!error && data) return data;
      } catch (error) {
        console.error("Erro ao buscar membros:", error);
      }
    }

    const members = getFromStorage<GroupMember>(GROUP_MEMBERS_KEY);
    return members.filter((m) => m.group_id === groupId);
  },

  removeMember: async (groupId: string, memberId: string, adminUserId: string): Promise<boolean> => {
    // Verificar se o usuário é admin/owner do grupo
    const group = await groupService.getGroupById(groupId);
    if (!group || (group.owner_id !== adminUserId)) {
      throw new Error("Apenas o dono do grupo pode remover membros");
    }

    if (supabaseService.isConfigured() && supabase) {
      try {
        const { error } = await supabase
          .from("group_members")
          .delete()
          .eq("group_id", groupId)
          .eq("user_id", memberId);

        if (error) throw error;
        return true;
      } catch (error) {
        console.error("Erro ao remover membro:", error);
        throw error;
      }
    }

    // Fallback
    const members = getFromStorage<GroupMember>(GROUP_MEMBERS_KEY);
    const filtered = members.filter((m) => !(m.group_id === groupId && m.user_id === memberId));
    saveToStorage(GROUP_MEMBERS_KEY, filtered);
    return true;
  },

  deleteGroup: async (groupId: string, userId: string): Promise<boolean> => {
    const group = await groupService.getGroupById(groupId);
    if (!group || group.owner_id !== userId) {
      throw new Error("Apenas o dono do grupo pode excluí-lo");
    }

    if (supabaseService.isConfigured() && supabase) {
      try {
        // Deletar grupo (cascade vai deletar membros e desafios)
        const { error } = await supabase
          .from("groups")
          .delete()
          .eq("id", groupId);

        if (error) throw error;
        return true;
      } catch (error) {
        console.error("Erro ao deletar grupo:", error);
        throw error;
      }
    }

    // Fallback
    const groups = getFromStorage<Group>(GROUPS_KEY);
    const filtered = groups.filter((g) => g.id !== groupId);
    saveToStorage(GROUPS_KEY, filtered);
    
    // Remover membros
    const members = getFromStorage<GroupMember>(GROUP_MEMBERS_KEY);
    const filteredMembers = members.filter((m) => m.group_id !== groupId);
    saveToStorage(GROUP_MEMBERS_KEY, filteredMembers);
    
    return true;
  },

  // ========== DESAFIOS ==========

  createChallenge: async (
    groupId: string,
    userId: string,
    userName: string,
    name: string,
    description: string,
    startDate: string,
    endDate: string
  ): Promise<Challenge> => {
    const challenge: Challenge = {
      id: Date.now().toString(),
      group_id: groupId,
      name,
      description,
      start_date: startDate,
      end_date: endDate,
      created_by: userId,
      created_by_name: userName,
      is_active: true,
      created_at: new Date().toISOString(),
      participant_count: 0,
    };

    if (supabaseService.isConfigured() && supabase) {
      try {
        const { error } = await supabase.from("challenges").insert({
          id: challenge.id,
          group_id: challenge.group_id,
          name: challenge.name,
          description: challenge.description,
          start_date: challenge.start_date,
          end_date: challenge.end_date,
          created_by: challenge.created_by,
          created_by_name: challenge.created_by_name,
          is_active: challenge.is_active,
          created_at: challenge.created_at,
        });

        if (error) throw error;
      } catch (error) {
        console.error("Erro ao criar desafio:", error);
        const challenges = getFromStorage<Challenge>(CHALLENGES_KEY);
        challenges.push(challenge);
        saveToStorage(CHALLENGES_KEY, challenges);
      }
    } else {
      const challenges = getFromStorage<Challenge>(CHALLENGES_KEY);
      challenges.push(challenge);
      saveToStorage(CHALLENGES_KEY, challenges);
    }

    return challenge;
  },

  getChallenges: async (groupId: string): Promise<Challenge[]> => {
    if (supabaseService.isConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from("challenges")
          .select("*")
          .eq("group_id", groupId)
          .order("created_at", { ascending: false });

        if (!error && data) return data;
      } catch (error) {
        console.error("Erro ao buscar desafios:", error);
      }
    }

    const challenges = getFromStorage<Challenge>(CHALLENGES_KEY);
    return challenges.filter((c) => c.group_id === groupId);
  },

  joinChallenge: async (
    challengeId: string,
    userId: string,
    userName: string
  ): Promise<ChallengeParticipant> => {
    const participant: ChallengeParticipant = {
      id: Date.now().toString(),
      challenge_id: challengeId,
      user_id: userId,
      user_name: userName,
      joined_at: new Date().toISOString(),
      total_points: 0,
    };

    if (supabaseService.isConfigured() && supabase) {
      try {
        const { error } = await supabase.from("challenge_participants").insert({
          id: participant.id,
          challenge_id: participant.challenge_id,
          user_id: participant.user_id,
          user_name: participant.user_name,
          joined_at: participant.joined_at,
          total_points: participant.total_points,
        });

        if (error) throw error;
      } catch (error) {
        console.error("Erro ao entrar no desafio:", error);
        const participants = getFromStorage<ChallengeParticipant>(CHALLENGE_PARTICIPANTS_KEY);
        participants.push(participant);
        saveToStorage(CHALLENGE_PARTICIPANTS_KEY, participants);
      }
    } else {
      const participants = getFromStorage<ChallengeParticipant>(CHALLENGE_PARTICIPANTS_KEY);
      participants.push(participant);
      saveToStorage(CHALLENGE_PARTICIPANTS_KEY, participants);
    }

    return participant;
  },

  getUserChallenges: async (userId: string): Promise<Challenge[]> => {
    if (supabaseService.isConfigured() && supabase) {
      try {
        const { data: participants, error } = await supabase
          .from("challenge_participants")
          .select("challenge_id")
          .eq("user_id", userId);

        if (participants && participants.length > 0) {
          const challengeIds = participants.map((p) => p.challenge_id);
          const { data: challenges, error: challengesError } = await supabase
            .from("challenges")
            .select("*")
            .in("id", challengeIds)
            .eq("is_active", true)
            .order("end_date", { ascending: false });

          if (!challengesError && challenges) return challenges;
        }
      } catch (error) {
        console.error("Erro ao buscar desafios do usuário:", error);
      }
    }

    return [];
  },

  // ========== TREINOS RÁPIDOS ==========

  createQuickWorkout: async (
    userId: string,
    userName: string,
    activityType: string,
    activityName: string,
    durationMinutes: number,
    date: string,
    points: number,
    challengeIds?: string[],
    photoUrl?: string,
    startTime?: string,
    durationHours?: number,
    durationMinutesDetailed?: number,
    durationSeconds?: number
  ): Promise<QuickWorkout> => {
    const workout: QuickWorkout = {
      id: Date.now().toString(),
      user_id: userId,
      user_name: userName,
      activity_type: activityType,
      activity_name: activityName,
      duration_minutes: durationMinutes,
      date,
      points,
      challenge_ids: challengeIds || [],
      photo_url: photoUrl,
      created_at: new Date().toISOString(),
      start_time: startTime,
      duration_hours: durationHours,
      duration_minutes_detailed: durationMinutesDetailed,
      duration_seconds: durationSeconds,
    };

    if (supabaseService.isConfigured() && supabase) {
      try {
        const { error } = await supabase.from("quick_workouts").insert({
          id: workout.id,
          user_id: workout.user_id,
          user_name: workout.user_name,
          activity_type: workout.activity_type,
          activity_name: workout.activity_name,
          duration_minutes: workout.duration_minutes,
          date: workout.date,
          points: workout.points,
          challenge_ids: workout.challenge_ids,
          photo_url: workout.photo_url,
          created_at: workout.created_at,
          start_time: workout.start_time || null,
          duration_hours: workout.duration_hours || 0,
          duration_minutes_detailed: workout.duration_minutes_detailed || 0,
          duration_seconds: workout.duration_seconds || 0,
        });

        if (error) throw error;

        // Atualizar pontos nos desafios
        if (challengeIds && challengeIds.length > 0) {
          for (const challengeId of challengeIds) {
            await groupService.updateChallengePoints(challengeId, userId, points);
          }
        }

        // Atualizar pontos do membro no grupo
        // TODO: Implementar atualização de pontos por grupo
      } catch (error) {
        console.error("Erro ao criar treino rápido:", error);
        const workouts = getFromStorage<QuickWorkout>(QUICK_WORKOUTS_KEY);
        workouts.push(workout);
        saveToStorage(QUICK_WORKOUTS_KEY, workouts);
      }
    } else {
      const workouts = getFromStorage<QuickWorkout>(QUICK_WORKOUTS_KEY);
      workouts.push(workout);
      saveToStorage(QUICK_WORKOUTS_KEY, workouts);
    }

    return workout;
  },

  updateChallengePoints: async (
    challengeId: string,
    userId: string,
    pointsToAdd: number
  ): Promise<void> => {
    if (supabaseService.isConfigured() && supabase) {
      try {
        // Buscar participante atual
        const { data: participant, error: fetchError } = await supabase
          .from("challenge_participants")
          .select("total_points")
          .eq("challenge_id", challengeId)
          .eq("user_id", userId)
          .single();

        if (fetchError || !participant) return;

        const newPoints = (participant.total_points || 0) + pointsToAdd;

        await supabase
          .from("challenge_participants")
          .update({ total_points: newPoints })
          .eq("challenge_id", challengeId)
          .eq("user_id", userId);
      } catch (error) {
        console.error("Erro ao atualizar pontos:", error);
      }
    }
  },

  getChallengeLeaderboard: async (challengeId: string): Promise<ChallengeParticipant[]> => {
    if (supabaseService.isConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from("challenge_participants")
          .select("*")
          .eq("challenge_id", challengeId)
          .order("total_points", { ascending: false });

        if (!error && data) {
          return data.map((p, index) => ({
            ...p,
            rank: index + 1,
          }));
        }
      } catch (error) {
        console.error("Erro ao buscar leaderboard:", error);
      }
    }

    const participants = getFromStorage<ChallengeParticipant>(CHALLENGE_PARTICIPANTS_KEY);
    return participants
      .filter((p) => p.challenge_id === challengeId)
      .sort((a, b) => (b.total_points || 0) - (a.total_points || 0))
      .map((p, index) => ({ ...p, rank: index + 1 }));
  },

  getGroupLeaderboard: async (groupId: string): Promise<GroupMember[]> => {
    if (supabaseService.isConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from("group_members")
          .select("*")
          .eq("group_id", groupId)
          .order("total_points", { ascending: false });

        if (!error && data) {
          return data.map((m, index) => ({
            ...m,
            rank: index + 1,
          }));
        }
      } catch (error) {
        console.error("Erro ao buscar ranking do grupo:", error);
      }
    }

    const members = getFromStorage<GroupMember>(GROUP_MEMBERS_KEY);
    return members
      .filter((m) => m.group_id === groupId)
      .sort((a, b) => (b.total_points || 0) - (a.total_points || 0))
      .map((m, index) => ({ ...m, rank: index + 1 }));
  },

  deleteChallenge: async (challengeId: string, userId: string): Promise<boolean> => {
    const challenge = await groupService.getChallenges("").then(challenges => 
      challenges.find(c => c.id === challengeId)
    );
    
    if (!challenge || challenge.created_by !== userId) {
      throw new Error("Apenas o criador do desafio pode excluí-lo");
    }

    if (supabaseService.isConfigured() && supabase) {
      try {
        const { error } = await supabase
          .from("challenges")
          .delete()
          .eq("id", challengeId);

        if (error) throw error;
        return true;
      } catch (error) {
        console.error("Erro ao deletar desafio:", error);
        throw error;
      }
    }

    // Fallback
    const challenges = getFromStorage<Challenge>(CHALLENGES_KEY);
    const filtered = challenges.filter((c) => c.id !== challengeId);
    saveToStorage(CHALLENGES_KEY, filtered);
    return true;
  },

  getFeedWorkouts: async (groupId?: string, challengeId?: string, limit: number = 50): Promise<QuickWorkout[]> => {
    if (supabaseService.isConfigured() && supabase) {
      try {
        let query = supabase.from("quick_workouts").select("*");

        if (challengeId) {
          query = query.contains("challenge_ids", [challengeId]);
        }

        const { data, error } = await query
          .order("created_at", { ascending: false })
          .limit(limit);

        if (!error && data) return data;
      } catch (error) {
        console.error("Erro ao buscar feed:", error);
      }
    }

    const workouts = getFromStorage<QuickWorkout>(QUICK_WORKOUTS_KEY);
    let filtered = workouts;

    if (challengeId) {
      filtered = filtered.filter((w) => w.challenge_ids?.includes(challengeId));
    }

    return filtered
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);
  },
};

