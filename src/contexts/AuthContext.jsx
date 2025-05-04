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

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      console.log("🔄 Initializing auth...");

      try {
        const { data, error } = await supabase.auth.getUser();
        console.log("🔐 getUser:", { data, error });

        if (error && error.message !== "Auth session missing!") {
          console.error("🚨 Error fetching user:", error.message);
        }

        const currentUser = data?.user || null;

        if (currentUser) {
          const { data: profile, error: profileErr } = await supabase
            .from("profiles")
            .select("language, first_name")
            .eq("id", currentUser.id)
            .single();

          console.log("📄 Profile on init:", { profile, profileErr });

          const enrichedUser = {
            ...currentUser,
            language: profile?.language || "en",
            firstName: profile?.first_name || "there",
          };

          if (isMounted) {
            setUser(enrichedUser);
            localStorage.setItem("auth_user", JSON.stringify(enrichedUser));
            console.log("✅ Auth set on mount:", enrichedUser);
          }
        } else if (isMounted) {
          setUser(null);
          localStorage.removeItem("auth_user");
          console.log("🚫 No user session found on init.");
        }
      } catch (err) {
        console.error("🔥 Unexpected error during auth init:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initializeAuth();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("📣 Auth state change:", event, session);
        setLoading(true);

        try {
          const newUser = session?.user || null;

          if (event === "SIGNED_UP" && newUser) {
            const language = navigator.language.startsWith("nl") ? "nl" : "en";
            const firstName = newUser.user_metadata?.firstName || "there";

            const { error: upsertErr } = await supabase.from("profiles").upsert({
              id: newUser.id,
              email: newUser.email,
              language,
              first_name: firstName,
            });

            console.log("📝 Profile upsert after sign up:", upsertErr || "Success");

            const trialStart = dayjs().locale(language).format("D MMMM YYYY");
            const trialEnd = dayjs().add(3, "day").locale(language).format("D MMMM YYYY");

            await sendEmail(newUser.email, language, "welcome", {
              name: firstName,
              trial_length: "3",
              trial_start_date: trialStart,
              trial_end_date: trialEnd,
              action_url: "https://app.cvitae.io/dashboard",
              support_url: "https://cvitae.io/help",
              year: String(new Date().getFullYear()),
            });
            console.log("📧 Welcome email sent");
          }

          if (newUser) {
            const { data: profile, error: profileErr } = await supabase
              .from("profiles")
              .select("language, first_name")
              .eq("id", newUser.id)
              .single();

            console.log("📄 Profile after state change:", { profile, profileErr });

            const enrichedUser = {
              ...newUser,
              language: profile?.language || "en",
              firstName: profile?.first_name || "there",
            };

            setUser(enrichedUser);
            localStorage.setItem("auth_user", JSON.stringify(enrichedUser));
            console.log("✅ Auth set from listener:", enrichedUser);
          } else {
            setUser(null);
            localStorage.removeItem("auth_user");
            console.log("🔕 User signed out or session expired");
          }
        } catch (err) {
          console.error("❌ onAuthStateChange error:", err);
        } finally {
          setLoading(false);
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
      console.log("👋 Logged out.");
    } catch (err) {
      console.error("❌ Logout error:", err);
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
