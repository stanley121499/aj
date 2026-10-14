import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  PropsWithChildren,
} from "react";
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { supabase } from "../utils/supabaseClient";
import { Database } from "../../database.types";
import { useAlertContext } from "./AlertContext";
import { useAuthContext } from "./AuthContext";

/** Setting key for the whole-app Baki kill-switch. */
export const BAKI_ENABLED_SETTING_KEY = "baki_enabled";

type AppSetting = Database["public"]["Tables"]["app_settings"]["Row"];

interface AppSettingsContextProps {
  /** Whether Baki is enabled app-wide. Defaults to false until loaded. */
  isBakiEnabled: boolean;
  /** True while the initial settings fetch is in progress. */
  loading: boolean;
  /**
   * Persist the Baki kill-switch. Admin-only (enforced by RLS + client check).
   * @param enabled - Whether Baki should be on for everyone
   */
  setBakiEnabled: (enabled: boolean) => Promise<boolean>;
}

const AppSettingsContext = createContext<AppSettingsContextProps | null>(null);

/**
 * Type guard for app_settings realtime payloads that include a usable row.
 */
function isAppSettingRow(value: unknown): value is AppSetting {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  if (!("key" in value) || !("value_boolean" in value)) {
    return false;
  }

  return (
    typeof value.key === "string" &&
    typeof value.value_boolean === "boolean"
  );
}

/**
 * Loads and exposes global app settings (currently the Baki kill-switch).
 * Subscribes to realtime updates so all clients pick up admin toggles.
 */
export function AppSettingsProvider({ children }: Readonly<PropsWithChildren>) {
  const [isBakiEnabled, setIsBakiEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const { showAlert } = useAlertContext();
  const { user_detail } = useAuthContext();

  useEffect(() => {
    let cancelled = false;

    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from("app_settings")
          .select("*")
          .eq("key", BAKI_ENABLED_SETTING_KEY)
          .maybeSingle();

        if (cancelled) {
          return;
        }

        if (error) {
          console.error("Error fetching app settings:", error);
          // Fail closed: keep Baki off if the setting cannot be loaded.
          setIsBakiEnabled(false);
        } else {
          setIsBakiEnabled(data?.value_boolean ?? false);
        }
      } catch (error) {
        console.error("Error fetching app settings:", error);
        if (!cancelled) {
          setIsBakiEnabled(false);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void fetchSettings();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel("app_settings_baki_enabled")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "app_settings",
          filter: `key=eq.${BAKI_ENABLED_SETTING_KEY}`,
        },
        (payload: RealtimePostgresChangesPayload<AppSetting>) => {
          if (payload.eventType === "DELETE") {
            setIsBakiEnabled(false);
            return;
          }

          const nextRow = payload.new;
          if (isAppSettingRow(nextRow)) {
            setIsBakiEnabled(nextRow.value_boolean);
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  /**
   * Updates baki_enabled for the whole app. Rejects non-admin callers client-side;
   * RLS also blocks unauthorized updates.
   */
  const setBakiEnabled = useCallback(
    async (enabled: boolean): Promise<boolean> => {
      if (user_detail?.role !== "admin") {
        showAlert("Only admins can change app settings", "error");
        return false;
      }

      const previous = isBakiEnabled;
      // Optimistic update for snappy UI; realtime will confirm for other clients.
      setIsBakiEnabled(enabled);

      const { data, error } = await supabase
        .from("app_settings")
        .update({ value_boolean: enabled })
        .eq("key", BAKI_ENABLED_SETTING_KEY)
        .select("*")
        .maybeSingle();

      if (error || !data) {
        console.error("Error updating baki_enabled:", error);
        setIsBakiEnabled(previous);
        showAlert("Failed to update Baki setting", "error");
        return false;
      }

      setIsBakiEnabled(data.value_boolean);
      showAlert(
        data.value_boolean ? "Baki enabled for everyone" : "Baki disabled for everyone",
        "success"
      );
      return true;
    },
    [user_detail?.role, isBakiEnabled, showAlert]
  );

  const value = useMemo(
    () => ({
      isBakiEnabled,
      loading,
      setBakiEnabled,
    }),
    [isBakiEnabled, loading, setBakiEnabled]
  );

  return (
    <AppSettingsContext.Provider value={value}>
      {children}
    </AppSettingsContext.Provider>
  );
}

/**
 * Hook to read/update global app settings (Baki kill-switch).
 */
export function useAppSettingsContext(): AppSettingsContextProps {
  const context = useContext(AppSettingsContext);

  if (!context) {
    throw new Error("useAppSettingsContext must be used within an AppSettingsProvider");
  }

  return context;
}
