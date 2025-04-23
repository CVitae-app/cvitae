import { useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";

/**
 * Returns the current authenticated Supabase user.
 * Memoized for performance.
 *
 * @returns {import('@supabase/supabase-js').User | null}
 */
const useSupabaseUser = () => {
  const auth = useAuth();
  const user = useMemo(() => auth?.user || null, [auth?.user]);
  return user;
};

export default useSupabaseUser;
