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
    if (supabase) {
      // Verificar sessão atual
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          loadUserFromSupabase(session.user);
        } else {
          // Fallback para localStorage
          const savedUser = localStorage.getItem("user");
          if (savedUser) {
            try {
              setUser(JSON.parse(savedUser));
            } catch (error) {
              console.error("Erro ao carregar usuário:", error);
              localStorage.removeItem("user");
            }
          }
          setLoading(false);
        }
      });

      // Ouvir mudanças de autenticação
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          loadUserFromSupabase(session.user);
        } else {
          setUser(null);
          localStorage.removeItem("user");
          setLoading(false);
        }
      });

      return () => subscription.unsubscribe();
    } else {
      // Fallback: usar localStorage se Supabase não estiver configurado
      const savedUser = localStorage.getItem("user");
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch (error) {
          console.error("Erro ao carregar usuário:", error);
          localStorage.removeItem("user");
        }
      }
      setLoading(false);
    }
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
    if (supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        await loadUserFromSupabase(data.user);
      }
    } else {
      // Fallback para localStorage
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      const mockUser: User = {
        id: Date.now().toString(),
        name: email.split("@")[0],
        email: email,
      };
      
      setUser(mockUser);
      localStorage.setItem("user", JSON.stringify(mockUser));
    }
  };

  const register = async (name: string, email: string, password: string) => {
    if (supabase) {
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

      if (authError) throw authError;

      if (authData.user) {
        // Criar perfil na tabela users
        try {
          const { error: profileError } = await supabase
            .from("users")
            .insert({
              id: authData.user.id,
              email: email,
              name: name,
            });

          if (profileError && profileError.code !== "23505") {
            // Ignorar erro de duplicata (usuário já existe)
            console.error("Erro ao criar perfil:", profileError);
          }
        } catch (error) {
          console.error("Erro ao criar perfil:", error);
        }

        // Carregar usuário
        await loadUserFromSupabase(authData.user);
      }
    } else {
      // Fallback para localStorage
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      const mockUser: User = {
        id: Date.now().toString(),
        name: name,
        email: email,
      };
      
      setUser(mockUser);
      localStorage.setItem("user", JSON.stringify(mockUser));
    }
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

