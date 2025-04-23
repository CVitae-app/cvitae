import { useEffect, useMemo } from "react";
import { supabase } from "../utils/supabaseClient";
import useDebouncedValue from "./useDebouncedValue";

/**
 * Generates a localStorage or Supabase-specific key.
 * @param {string} key - The field name.
 * @param {object|null} user - Supabase user object or null.
 * @returns {string}
 */
const getStorageKey = (key, user) => (user ? `user:${user.id}:${key}` : `local:${key}`);

/**
 * Smart syncing hook for syncing data to Supabase (if logged in) or localStorage (anon).
 * @param {string} key - Key in Supabase (column) or localStorage (fallback).
 * @param {*} data - Data to sync.
 * @param {object|null} user - Supabase user or null.
 */
export default function useSmartSync(key, data, user) {
  const debouncedData = useDebouncedValue(data, 500);

  const storageKey = useMemo(() => getStorageKey(key, user), [key, user]);

  useEffect(() => {
    if (!debouncedData) return;

    const sync = async () => {
      try {
        if (user) {
          const { error } = await supabase
            .from("cvs")
            .update({ [key]: debouncedData, updated_at: new Date().toISOString() })
            .eq("user_id", user.id);

          if (error) throw new Error(error.message);
        } else {
          localStorage.setItem(storageKey, JSON.stringify(debouncedData));
        }
      } catch (err) {
        console.error(`🛑 Failed to sync "${key}" — ${err.message}`);
      }
    };

    sync();
  }, [debouncedData, key, user, storageKey]);
}
