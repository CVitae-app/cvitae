import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import { supabase } from "@/utils/supabaseClient";
import { sendEmail } from "@/utils/email";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    initializeAuth();
  }, []);

  // ✅ Initialize Authentication State
  const initializeAuth = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const currentUser = sessionData?.session?.user || null;

      if (currentUser) {
        const enrichedUser = await fetchUserProfile(currentUser);
        setUser(enrichedUser);
        secureLocalStorage("auth_user", enrichedUser);
        console.log("✅ Auth Initialized - User Loaded:", enrichedUser);
      } else {
        setUser(null);
        secureLocalStorage("auth_user", null);
        console.warn("❌ No active session - User logged out");
      }
    } catch (error) {
      console.error("❌ Error initializing auth:", error);
      setUser(null);
    } finally {
      setLoading(false);
      setIsHydrated(true);
      console.log("✅ Auth Initialized - Is Hydrated:", true);
    }

    // ✅ Listen to Auth State Changes Automatically
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("✅ Auth State Changed - Event:", event);
        if (session?.user) {
          const enrichedUser = await fetchUserProfile(session.user);
          setUser(enrichedUser);
          secureLocalStorage("auth_user", enrichedUser);
          console.log("✅ Auth State Changed - User:", enrichedUser);
        } else {
          setUser(null);
          secureLocalStorage("auth_user", null);
          console.warn("❌ Auth State Changed - User logged out");
        }
        setIsHydrated(true);
      }
    );

    return () => {
      listener?.subscription?.unsubscribe?.();
    };
  };

  // ✅ Fetches and Enriches User Profile Securely
  const fetchUserProfile = useCallback(async (currentUser) => {
    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select(
          "language, first_name, last_name, email, is_subscribed, subscription_plan, subscription_status, subscription_ends, trial_ends"
        )
        .eq("id", currentUser.id)
        .single();

      if (error) {
        console.error("❌ Error fetching profile:", error);
      }

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
    } catch (err) {
      console.error("❌ Error enriching user:", err);
      return { ...currentUser, language: "en", firstName: "there" };
    }
  }, []);

  // ✅ Securely Manages Local Storage to Prevent Stale Data
  const secureLocalStorage = (key, value) => {
    try {
      if (value) {
        localStorage.setItem(key, JSON.stringify(value));
      } else {
        localStorage.removeItem(key);
      }
    } catch (error) {
      console.error("❌ Error setting local storage:", error);
    }
  };

  // ✅ Refreshes the Session and User Profile Securely
  const refreshSession = useCallback(async () => {
    try {
      console.log("✅ Refreshing session...");
      const { data: sessionData } = await supabase.auth.getSession();
      const currentUser = sessionData?.session?.user || null;

      if (currentUser) {
        const enrichedUser = await fetchUserProfile(currentUser);
        setUser(enrichedUser);
        secureLocalStorage("auth_user", enrichedUser);
        console.log("✅ Session refreshed - User:", enrichedUser);
      } else {
        setUser(null);
        secureLocalStorage("auth_user", null);
        console.warn("❌ Session refresh - No active session");
      }
    } catch (error) {
      console.error("❌ Error during session refresh:", error);
      setUser(null);
    }
  }, [fetchUserProfile]);

  // ✅ Directly Refreshes User Profile (Subscription Updates)
  const refreshProfile = useCallback(async () => {
    if (!user) return;
    try {
      console.log("✅ Refreshing user profile...");
      const enrichedUser = await fetchUserProfile(user);
      setUser(enrichedUser);
      secureLocalStorage("auth_user", enrichedUser);
      console.log("✅ User profile refreshed:", enrichedUser);
    } catch (error) {
      console.error("❌ Error refreshing user profile:", error);
    }
  }, [user, fetchUserProfile]);

  // ✅ Logout and Clear User Securely
  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      secureLocalStorage("auth_user", null);
      console.log("✅ User logged out");
    } catch (error) {
      console.error("❌ Error during logout:", error);
    }
  }, []);

  // ✅ Memoized Context Value for Best Performance
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

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// ✅ Custom Hook to Securely Use AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
