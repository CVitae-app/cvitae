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

/**
 * AuthProvider manages authentication state with Supabase and provides it to the app.
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch current user on mount
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error && error.message !== "Auth session missing!") {
          console.error("Error fetching user:", error.message);
        }

        const currentUser = data?.user || null;
        if (isMounted) {
          setUser(currentUser);
          if (currentUser) {
            localStorage.setItem("auth_user", JSON.stringify(currentUser));
          } else {
            localStorage.removeItem("auth_user");
          }
        }
      } catch (err) {
        console.error("Unexpected auth error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initializeAuth();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const newUser = session?.user || null;
        setUser(newUser);

        if (newUser) {
          localStorage.setItem("auth_user", JSON.stringify(newUser));
        } else {
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

/**
 * useAuth provides access to the authenticated user and logout function.
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
