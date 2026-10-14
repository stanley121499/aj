import type { PropsWithChildren } from "react";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../utils/supabaseClient";
import { Database } from "../../database.types";

type UserDetail = Database["public"]["Tables"]["user_details"]["Row"];

interface AuthContextProps {
  user: User | null;
  user_detail: UserDetail | null;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ user?: User; error?: unknown }>;
  signOut: () => Promise<{ error?: unknown } | undefined>;
  loading: boolean;
  /**
   * Marks onboarding complete for the current user and refreshes user_detail.
   * @returns True when the update succeeded
   */
  markOnboardingComplete: () => Promise<boolean>;
  /**
   * Reloads user_details for the signed-in user.
   */
  refreshUserDetail: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [user_detail, setUserDetail] = useState<UserDetail | null>(null);

  /**
   * Loads user_details for a given auth user id.
   * @param userId - Auth user UUID
   */
  const loadUserDetail = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from("user_details")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) {
      console.error("Error fetching user details:", error);
      setUserDetail(null);
      return;
    }

    setUserDetail(data);
  }, []);

  const refreshUserDetail = useCallback(async () => {
    if (!user?.id) {
      return;
    }
    await loadUserDetail(user.id);
  }, [user?.id, loadUserDetail]);

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user: authUser },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        console.error("Error getting user:", error);
      }

      if (authUser) {
        await loadUserDetail(authUser.id);
      }

      setUser(authUser);
      setLoading(false);
    };

    fetchUser();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const nextUser = session?.user || null;
        setUser(nextUser);
        if (nextUser) {
          // Keep loading true until role/details exist — RoleProtectedRoute needs them.
          void loadUserDetail(nextUser.id).finally(() => {
            setLoading(false);
          });
        } else {
          setUserDetail(null);
          setLoading(false);
        }
      }
    );

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, [loadUserDetail]);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      console.error("Error during sign in:", error);
      setLoading(false);
      return { error };
    }
    setUser(data.user);

    const { data: detail, error: userDetailError } = await supabase
      .from("user_details")
      .select("*")
      .eq("user_id", data.user.id)
      .single();

    if (userDetailError) {
      console.error("Error fetching user details:", userDetailError);
      setLoading(false);
      return { error: userDetailError };
    }

    setUserDetail(detail);
    setLoading(false);
    return { user: data.user };
  };

  const signOut = async () => {
    setLoading(true);
    setUser(null);
    setUserDetail(null);

    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error signing out:", error);
      setLoading(false);
      return { error };
    }

    setLoading(false);
  };

  /**
   * Persists onboarding_completed_at on user_details.
   */
  const markOnboardingComplete = useCallback(async (): Promise<boolean> => {
    if (!user?.id) {
      return false;
    }

    const completedAt = new Date().toISOString();
    const { data, error } = await supabase
      .from("user_details")
      .update({ onboarding_completed_at: completedAt })
      .eq("user_id", user.id)
      .select("*")
      .single();

    if (error || !data) {
      console.error("Error marking onboarding complete:", error);
      return false;
    }

    setUserDetail(data);
    return true;
  }, [user?.id]);

  return (
    <AuthContext.Provider
      value={{
        user,
        user_detail,
        signIn,
        signOut,
        loading,
        markOnboardingComplete,
        refreshUserDetail,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuthContext should be used within the AuthProvider provider!"
    );
  }

  return context;
}
