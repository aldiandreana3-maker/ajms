import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

type AppRole = "master_dev" | "super_admin" | "admin" | "staff" | "agent" | "penghuni" | "staff_tro" | "staff_finance" | "staff_hrd_ga" | "staff_engineering" | "staff_building_service" | "staff_outsourcing_cleaning" | "staff_outsourcing_security" | "staff_outsourcing_parkir" | "staff_purchasing";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isMasterDev: boolean;
  isStaff: boolean;
  isAgent: boolean;
  isPenghuni: boolean;
  isLimitedAccess: boolean; // penghuni or agent - same limited access
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer role fetching with setTimeout to avoid deadlock
        if (session?.user) {
          setTimeout(() => {
            fetchUserRole(session.user.id);
          }, 0);
        } else {
          setRole(null);
          setIsLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserRole(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching user role:", error);
      }
      
      setRole(data?.role as AppRole || null);
    } catch (err) {
      console.error("Error in fetchUserRole:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
  };

  const isMasterDev = role === "master_dev";
  const isAdmin = role === "admin" || role === "super_admin" || isMasterDev;
  const isSuperAdmin = role === "super_admin" || isMasterDev;
  const isAgent = role === "agent";
  const isPenghuni = role === "penghuni";
  const isLimitedAccess = role === "penghuni" || role === "agent";
  const isStaff = role === "staff" || role === "staff_tro" || role === "staff_finance" || role === "staff_hrd_ga" || role === "staff_engineering" || role === "staff_building_service" || role === "staff_outsourcing_cleaning" || role === "staff_outsourcing_security" || role === "staff_outsourcing_parkir" || role === "staff_purchasing" || isAdmin;

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        role,
        isLoading,
        signIn,
        signUp,
        signOut,
        isAdmin,
        isSuperAdmin,
        isMasterDev,
        isStaff,
        isAgent,
        isPenghuni,
        isLimitedAccess,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
