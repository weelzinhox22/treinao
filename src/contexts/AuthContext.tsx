import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/config/supabase";
import { profileService } from "@/services/profileService";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface User {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar sessão do Supabase
    if (!supabase) {
      console.warn("⚠️ Supabase não configurado. Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY");
      setLoading(false);
      return;
    }

    // Verificar sessão atual
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error("Erro ao verificar sessão:", error);
        setLoading(false);
        return;
      }

      if (session?.user) {
        loadUserFromSupabase(session.user);
      } else {
        // Limpar dados locais se não houver sessão
        localStorage.removeItem("user");
        setUser(null);
        setLoading(false);
      }
    });

    // Ouvir mudanças de autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", event, session?.user?.email);
      
      if (session?.user) {
        loadUserFromSupabase(session.user);
      } else {
        setUser(null);
        localStorage.removeItem("user");
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserFromSupabase = async (supabaseUser: SupabaseUser) => {
    try {
      // Buscar perfil completo do usuário
      const profile = await profileService.getProfile(supabaseUser.id);
      
      const userData: User = {
        id: supabaseUser.id,
        name: profile?.name || supabaseUser.user_metadata?.name || supabaseUser.email?.split("@")[0] || "Usuário",
        email: supabaseUser.email || "",
        avatar_url: profile?.avatar_url || supabaseUser.user_metadata?.avatar_url,
      };

      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
    } catch (error) {
      console.error("Erro ao carregar perfil:", error);
      // Usar dados básicos do Supabase
      const userData: User = {
        id: supabaseUser.id,
        name: supabaseUser.user_metadata?.name || supabaseUser.email?.split("@")[0] || "Usuário",
        email: supabaseUser.email || "",
        avatar_url: supabaseUser.user_metadata?.avatar_url,
      };
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    if (!supabase) {
      throw new Error("Supabase não configurado. Configure as variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY");
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Erro ao fazer login:", error);
      throw error;
    }

    if (!data.user) {
      throw new Error("Falha ao autenticar. Tente novamente.");
    }

    await loadUserFromSupabase(data.user);
  };

  const register = async (name: string, email: string, password: string) => {
    if (!supabase) {
      throw new Error("Supabase não configurado. Configure as variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY");
    }

    // Verificar se o email já existe
    const { data: existingUsers, error: checkError } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .limit(1);

    if (checkError && checkError.code !== "PGRST116") {
      console.warn("Erro ao verificar email existente:", checkError);
    }

    if (existingUsers && existingUsers.length > 0) {
      throw new Error("Este email já está cadastrado. Faça login ou use outro email.");
    }

    // Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name,
        },
      },
    });

    if (authError) {
      console.error("Erro ao criar usuário:", authError);
      throw authError;
    }

    if (!authData.user) {
      throw new Error("Falha ao criar conta. Tente novamente.");
    }

    // Criar perfil na tabela users
    const { error: profileError } = await supabase
      .from("users")
      .insert({
        id: authData.user.id,
        email: email,
        name: name,
        created_at: new Date().toISOString(),
      });

    if (profileError && profileError.code !== "23505") {
      // Ignorar erro de duplicata (usuário já existe)
      console.error("Erro ao criar perfil:", profileError);
      // Continuar mesmo assim, pois o usuário foi criado no Auth
    }

    // Carregar usuário
    await loadUserFromSupabase(authData.user);
  };

  const logout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("treinos");
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        updateUser,
        isAuthenticated: !!user,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
};

