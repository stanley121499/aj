import type { PropsWithChildren } from "react";
import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../utils/supabaseClient";

interface AuthContextProps {
  user: any;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<any>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextProps>(undefined!);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error) {
        console.error('Error getting user:', error);
      }

      setUser(user);
      setLoading(false); // Update loading state after user is set
    };

    fetchUser();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      setLoading(false); // Ensure to set loading to false here as well
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);



  const signIn = async (email: string, password: string) => {
    setLoading(true); // Consider setting loading to true to indicate starting the sign-in process
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.error('Error during sign in:', error);
      setLoading(false); // Ensure to set loading to false in case of an error
      return { error };
    }
    setUser(data.user);
    setLoading(false);
    return { user: data.user };
  }

  const signOut = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error signing out:", error);
      setLoading(false);
      return { error };
    }
    setUser(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, signIn, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);

  if (typeof context === "undefined") {
    throw new Error(
      "useAuthContext should be used within the AuthProvider provider!"
    );
  }

  return context;
}

