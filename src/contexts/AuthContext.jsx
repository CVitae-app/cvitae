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

  // Fetch current user + profile on mount
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error && error.message !== "Auth session missing!") {
          console.error("Error fetching user:", error.message);
        }

        const currentUser = data?.user || null;

        if (currentUser) {
          // Fetch language from profile
          const { data: profile } = await supabase
            .from("profiles")
            .select("language, first_name")
            .eq("id", currentUser.id)
            .single();

          const enrichedUser = {
            ...currentUser,
            language: profile?.language || "en",
            firstName: profile?.first_name || "there",
          };

          if (isMounted) {
            setUser(enrichedUser);
            localStorage.setItem("auth_user", JSON.stringify(enrichedUser));
          }
        } else if (isMounted) {
          setUser(null);
          localStorage.removeItem("auth_user");
        }
      } catch (err) {
        console.error("Unexpected auth error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initializeAuth();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const newUser = session?.user || null;

        if (event === "SIGNED_UP" && newUser) {
          const language = navigator.language.startsWith("nl") ? "nl" : "en";
          const firstName = newUser.user_metadata?.firstName || "there";

          // Store language and name in profiles
          await supabase.from("profiles").upsert({
            id: newUser.id,
            email: newUser.email,
            language,
            first_name: firstName,
          });

          // Format dates for welcome email
          const locale = language === "nl" ? "nl" : "en";
          const trialStart = dayjs().locale(locale).format("D MMMM YYYY");
          const trialEnd = dayjs().add(3, "day").locale(locale).format("D MMMM YYYY");

          // Send welcome email
          await sendEmail(newUser.email, language, "welcome", {
            name: firstName,
            trial_length: "3",
            trial_start_date: trialStart,
            trial_end_date: trialEnd,
            action_url: "https://app.cvitae.io/dashboard",
            support_url: "https://cvitae.io/help",
            year: String(new Date().getFullYear()),
          });
        }

        // On any auth state change, fetch full user data from profiles
        if (newUser) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("language, first_name")
            .eq("id", newUser.id)
            .single();

          const enrichedUser = {
            ...newUser,
            language: profile?.language || "en",
            firstName: profile?.first_name || "there",
          };

          setUser(enrichedUser);
          localStorage.setItem("auth_user", JSON.stringify(enrichedUser));
        } else {
          setUser(null);
          localStorage.removeItem("auth_user");
        }
      }
    );

    return () => {
      isMounted = false;
      listener?.subscription?.unsubscribe?.();
    };
  }, []);

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      localStorage.removeItem("auth_user");
    } catch (err) {
      console.error("Logout error:", err);
    }
  }, []);

  const authContextValue = useMemo(
    () => ({ user, logout, loading }),
    [user, logout, loading]
  );

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
