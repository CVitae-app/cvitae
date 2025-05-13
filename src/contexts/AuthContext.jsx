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
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const currentUser = sessionData?.session?.user || null;

        if (currentUser) {
          const enrichedUser = await fetchUserProfile(currentUser);
          if (isMounted) {
            setUser(enrichedUser);
            localStorage.setItem("auth_user", JSON.stringify(enrichedUser));
          }
        } else if (isMounted) {
          setUser(null);
          localStorage.removeItem("auth_user");
        }
      } catch (error) {
        console.error("❌ Error initializing auth:", error);
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) {
          setLoading(false);
          setIsHydrated(true);
        }
      }
    };

    initializeAuth();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setLoading(true);
        try {
          const newUser = session?.user || null;

          if (event === "SIGNED_UP" && newUser) {
            await handleNewUserSignup(newUser);
          }

          if (newUser) {
            const enrichedUser = await fetchUserProfile(newUser);
            setUser(enrichedUser);
            localStorage.setItem("auth_user", JSON.stringify(enrichedUser));
          } else {
            setUser(null);
            localStorage.removeItem("auth_user");
          }
        } catch (error) {
          console.error("❌ Error in auth state change:", error);
          setUser(null);
        } finally {
          setLoading(false);
          setIsHydrated(true);
        }
      }
    );

    return () => {
      isMounted = false;
      listener?.subscription?.unsubscribe?.();
    };
  }, []);

  // ✅ Fetches user profile and enriches the user object
  const fetchUserProfile = async (currentUser) => {
    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("language, first_name")
        .eq("id", currentUser.id)
        .single();

      if (error) {
        console.error("❌ Error fetching profile:", error);
      }

      return {
        ...currentUser,
        language: profile?.language || "en",
        firstName: profile?.first_name || "there",
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

      // ✅ Save new user profile
      await supabase.from("profiles").upsert({
        id: newUser.id,
        email: newUser.email,
        language,
        first_name: firstName,
      });

      // ✅ Send welcome email
      const trialStart = dayjs().locale(language).format("D MMMM YYYY");
      const trialEnd = dayjs().add(3, "day").locale(language).format("D MMMM YYYY");

      await sendEmail(newUser.email, language, "welcome", {
        name: firstName,
        trial_length: "3",
        trial_start_date: trialStart,
        trial_end_date: trialEnd,
        action_url: "https://app.cvitae.nl/dashboard",
        support_url: "https://cvitae.nl/help",
        year: String(new Date().getFullYear()),
      });

      console.log("✅ Welcome email sent to:", newUser.email);
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
    } catch (error) {
      console.error("❌ Error during logout:", error);
    }
  }, []);

  // ✅ Automatically refresh session if user is logged in
  const refreshSession = useCallback(async () => {
    try {
      const { data: sessionData, error } = await supabase.auth.getSession();
      if (error) {
        console.error("❌ Error refreshing session:", error);
        return;
      }

      const currentUser = sessionData?.session?.user || null;
      if (currentUser) {
        const enrichedUser = await fetchUserProfile(currentUser);
        setUser(enrichedUser);
        localStorage.setItem("auth_user", JSON.stringify(enrichedUser));
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
