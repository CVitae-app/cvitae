import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import { supabase } from "@/utils/supabaseClient";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const currentUser = sessionData?.session?.user || null;

      if (currentUser) {
        const enrichedUser = await fetchUserProfile(currentUser);
        setUser(enrichedUser);
        secureLocalStorage("auth_user", enrichedUser);
      } else {
        setUser(null);
        secureLocalStorage("auth_user", null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
      setIsHydrated(true);
    }

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const enrichedUser = await fetchUserProfile(session.user);
          setUser(enrichedUser);
          secureLocalStorage("auth_user", enrichedUser);
        } else {
          setUser(null);
          secureLocalStorage("auth_user", null);
        }
        setIsHydrated(true);
      }
    );

    return () => listener?.subscription?.unsubscribe?.();
  };

  const fetchUserProfile = useCallback(async (currentUser) => {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select(
          "language, first_name, last_name, email, is_subscribed, subscription_plan, subscription_status, subscription_ends, trial_ends"
        )
        .eq("id", currentUser.id)
        .single();

      return {
        ...currentUser,
        language: profile?.language || "en",
        firstName: profile?.first_name || "there",
        lastName: profile?.last_name || "",
        email: profile?.email || currentUser.email,
        isSubscribed: profile?.is_subscribed || false,
        subscriptionPlan: profile?.subscription_plan || null,
        subscriptionStatus: profile?.subscription_status || null,
        subscriptionEnds: profile?.subscription_ends || null,
        trialEnds: profile?.trial_ends || null,
      };
    } catch {
      return { ...currentUser, language: "en", firstName: "there" };
    }
  }, []);

  const secureLocalStorage = (key, value) => {
    try {
      if (value) {
        localStorage.setItem(key, JSON.stringify(value));
      } else {
        localStorage.removeItem(key);
      }
    } catch {}
  };

  const refreshSession = useCallback(async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const currentUser = sessionData?.session?.user || null;

      if (currentUser) {
        const enrichedUser = await fetchUserProfile(currentUser);
        setUser(enrichedUser);
        secureLocalStorage("auth_user", enrichedUser);
      } else {
        setUser(null);
        secureLocalStorage("auth_user", null);
      }
    } catch {
      setUser(null);
    }
  }, [fetchUserProfile]);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    try {
      const enrichedUser = await fetchUserProfile(user);
      setUser(enrichedUser);
      secureLocalStorage("auth_user", enrichedUser);
    } catch {}
  }, [user, fetchUserProfile]);

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      secureLocalStorage("auth_user", null);
    } catch {}
  }, []);

  const authContextValue = useMemo(
    () => ({
      user,
      loading,
      isHydrated,
      logout,
      refreshSession,
      refreshProfile,
    }),
    [user, loading, isHydrated, logout, refreshSession, refreshProfile]
  );

  return <AuthContext.Provider value={authContextValue}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
