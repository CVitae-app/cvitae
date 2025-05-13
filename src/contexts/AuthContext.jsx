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
import dayjs from "dayjs";
import "dayjs/locale/nl";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const currentUser = sessionData?.session?.user || null;

        if (currentUser) {
          const enrichedUser = await fetchUserProfile(currentUser);
          setUser(enrichedUser);
          localStorage.setItem("auth_user", JSON.stringify(enrichedUser));
          console.log("✅ Auth Initialized - User Loaded:", enrichedUser);
        } else {
          setUser(null);
          localStorage.removeItem("auth_user");
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
    };

    initializeAuth();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("✅ Auth State Changed - Event:", event);
        if (session?.user) {
          const enrichedUser = await fetchUserProfile(session.user);
          setUser(enrichedUser);
          localStorage.setItem("auth_user", JSON.stringify(enrichedUser));
          console.log("✅ Auth State Changed - User:", enrichedUser);
        } else {
          setUser(null);
          localStorage.removeItem("auth_user");
          console.warn("❌ Auth State Changed - User logged out");
        }
        setIsHydrated(true);
        console.log("✅ Auth State Change Completed - Is Hydrated:", true);
      }
    );

    return () => {
      listener?.subscription?.unsubscribe?.();
    };
  }, []);

  // ✅ Fetches user profile and enriches the user object
  const fetchUserProfile = async (currentUser) => {
    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("language, first_name, is_subscribed")
        .eq("id", currentUser.id)
        .single();

      if (error) {
        console.error("❌ Error fetching profile:", error);
      }

      return {
        ...currentUser,
        language: profile?.language || "en",
        firstName: profile?.first_name || "there",
        isSubscribed: profile?.is_subscribed || false,
      };
    } catch (err) {
      console.error("❌ Error enriching user:", err);
      return { ...currentUser, language: "en", firstName: "there" };
    }
  };

  // ✅ Handles new user signup, including profile creation and welcome email
  const handleNewUserSignup = async (newUser) => {
    try {
      const language = navigator.language.startsWith("nl") ? "nl" : "en";
      const firstName = newUser.user_metadata?.firstName || "there";

      await supabase.from("profiles").upsert({
        id: newUser.id,
        email: newUser.email,
        language,
        first_name: firstName,
      });

      console.log("✅ User Profile Created for:", newUser.email);
    } catch (error) {
      console.error("❌ Error during signup process:", error);
    }
  };

  // ✅ Logout function (clears user and localStorage)
  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      localStorage.removeItem("auth_user");
      console.log("✅ User logged out");
    } catch (error) {
      console.error("❌ Error during logout:", error);
    }
  }, []);

  // ✅ Refresh session and re-fetch user data
  const refreshSession = useCallback(async () => {
    try {
      console.log("✅ Refreshing session...");
      const { data: sessionData } = await supabase.auth.getSession();
      const currentUser = sessionData?.session?.user || null;

      if (currentUser) {
        const enrichedUser = await fetchUserProfile(currentUser);
        setUser(enrichedUser);
        localStorage.setItem("auth_user", JSON.stringify(enrichedUser));
        console.log("✅ Session refreshed - User:", enrichedUser);
      } else {
        setUser(null);
        localStorage.removeItem("auth_user");
        console.warn("❌ Session refresh - No active session");
      }
    } catch (error) {
      console.error("❌ Error during session refresh:", error);
      setUser(null);
    }
  }, []);

  // ✅ Memoized context value for performance
  const authContextValue = useMemo(
    () => ({ user, logout, loading, isHydrated, refreshSession }),
    [user, logout, loading, isHydrated, refreshSession]
  );

  useEffect(() => {
    console.log("✅ AuthContext - User state changed:", user);
    console.log("✅ AuthContext - Is Hydrated:", isHydrated);
  }, [user, isHydrated]);

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// ✅ Custom hook to use the AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
