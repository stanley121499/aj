import React, { createContext, useContext, useEffect, useState, PropsWithChildren, useCallback } from "react";
import { supabase } from "../utils/supabaseClient";
import { Database } from "../../database.types";
import { useAlertContext } from "./AlertContext";
import { useAppSettingsContext } from "./AppSettingsContext";
import { useAuthContext } from "./AuthContext";
import { useRealtimeSubscription } from "../utils/useRealtimeSubscription";

/** Shared error message when Baki mutations are blocked by the kill-switch. */
const BAKI_DISABLED_MESSAGE = "Baki is currently disabled";

export type Baki = Database['public']['Tables']['bakis']['Row'];
export type Bakis = { bakis: Baki[] };
export type BakiInsert = Database['public']['Tables']['bakis']['Insert'];

interface BakiContextProps {
  bakis: Baki[];
  addBaki: (baki: BakiInsert) => Promise<Baki | undefined>;
  getOrCreateBaki: (userId: string, categoryId: number) => Promise<Baki>;
  deleteBaki: (baki: Baki) => Promise<void>;
  updateBaki: (baki: Baki) => Promise<void>;
  updateBalanceWithTransaction: (baki: Baki, amount: number, type: "debit" | "credit") => Promise<void>;
  loading: boolean;
  currentUserBaki: Baki[];
}

const BakiContext = createContext<BakiContextProps>(undefined!);

export function BakiProvider({ children }: PropsWithChildren) {
  const [bakis, setBakis] = useState<Baki[]>([]);
  const [loading, setLoading] = useState(true);
  const { showAlert } = useAlertContext();
  const { user } = useAuthContext();
  const { isBakiEnabled } = useAppSettingsContext();
  const [currentUserBaki, setCurrentUserBaki] = useState<Baki[]>([]);

  useEffect(() => {
    let cancelled = false;

    // When Baki is off, clear local state and skip fetches/alerts for bakis.
    if (!isBakiEnabled) {
      setBakis([]);
      setCurrentUserBaki([]);
      setLoading(false);
      return;
    }

    const fetchBakis = async () => {
      setLoading(true);
      try {
        const { data: bakis, error } = await supabase
          .from("bakis")
          .select("*");

        if (error) {
          console.error("Error fetching bakis:", error);
          showAlert("Error fetching bakis", "error");
        }

        if (!cancelled) {
          setBakis(bakis || []);
          setCurrentUserBaki(
            bakis?.filter((baki) => baki.user_id === user?.id) || []
          );
        }
      } catch (error) {
        console.error("Error fetching bakis:", error);
        showAlert("Error fetching bakis", "error");
        if (!cancelled) {
          setBakis([]);
          setCurrentUserBaki([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void fetchBakis();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- showAlert omitted to avoid refetch loops
  }, [user?.id, isBakiEnabled]);

  const handleRealtimeChanges = useCallback((payload: { eventType: string; new: Baki; old: Baki }) => {
    if (!isBakiEnabled) {
      return;
    }

    setBakis(prev => {
      switch (payload.eventType) {
        case 'INSERT':
          return [payload.new, ...prev];
        case 'UPDATE':
          return prev.map(baki => baki.id === payload.new.id ? payload.new : baki);
        case 'DELETE':
          return prev.filter(baki => baki.id !== payload.old.id);
        default:
          return prev;
      }
    });
  }, [isBakiEnabled]);

  const trackOperation = useRealtimeSubscription<Baki>(
    { table: "bakis" },
    handleRealtimeChanges
  );

  const addBaki = useCallback(async (baki: BakiInsert) => {
    if (!isBakiEnabled) {
      showAlert(BAKI_DISABLED_MESSAGE, "error");
      return undefined;
    }

    const { data, error } = await supabase
      .from('bakis')
      .insert(baki)
      .select()
      .single();

    if (error) {
      console.error('Error adding baki:', error);
      showAlert('Error adding baki', 'error');
      return undefined;
    }

    if (data) {
      trackOperation({
        id: data.id,
        type: "INSERT",
        timestamp: Date.now(),
        data
      });
    }

    return data;
  }, [showAlert, trackOperation, isBakiEnabled]);

  const deleteBaki = useCallback(async (baki: Baki) => {
    if (!isBakiEnabled) {
      showAlert(BAKI_DISABLED_MESSAGE, "error");
      return;
    }

    trackOperation({
      id: baki.id,
      type: "DELETE",
      timestamp: Date.now()
    });

    const { error } = await supabase
      .from('bakis')
      .delete()
      .eq('id', baki.id);

    if (error) {
      console.error('Error deleting baki:', error);
      showAlert('Error deleting baki', 'error');
    }
  }, [showAlert, trackOperation, isBakiEnabled]);

  const updateBaki = useCallback(async (baki: Baki) => {
    if (!isBakiEnabled) {
      showAlert(BAKI_DISABLED_MESSAGE, "error");
      return;
    }

    trackOperation({
      id: baki.id,
      type: "UPDATE",
      timestamp: Date.now(),
      data: baki
    });

    const { error } = await supabase
      .from('bakis')
      .update(baki)
      .eq('id', baki.id);

    if (error) {
      console.error('Error updating baki:', error);
      showAlert('Error updating baki', 'error');
    }
  }, [showAlert, trackOperation, isBakiEnabled]);

  const getOrCreateBaki = useCallback(async (userId: string, categoryId: number): Promise<Baki> => {
    if (!isBakiEnabled) {
      throw new Error(BAKI_DISABLED_MESSAGE);
    }

    const existingBaki = bakis.find(
      (b) => b.user_id === userId && b.category_id === categoryId
    );

    if (existingBaki) {
      return existingBaki;
    }

    const newBaki = await addBaki({
      user_id: userId,
      category_id: categoryId,
      balance: 0,
    });

    if (!newBaki) {
      throw new Error(`Failed to create baki for user: ${userId}`);
    }

    return newBaki;
  }, [bakis, addBaki, isBakiEnabled]);

  const updateBalanceWithTransaction = useCallback(async (baki: Baki, amount: number, type: "debit" | "credit") => {
    if (!isBakiEnabled) {
      showAlert(BAKI_DISABLED_MESSAGE, "error");
      throw new Error(BAKI_DISABLED_MESSAGE);
    }

    const balanceChange = type === "debit" ? amount : -amount;
    const newBalance = baki.balance + balanceChange;
    const updatedBaki = { ...baki, balance: newBalance };

    trackOperation({
      id: baki.id,
      type: "UPDATE",
      timestamp: Date.now(),
      data: updatedBaki
    });

    const { error: updateError } = await supabase
      .from("bakis")
      .update({ balance: newBalance })
      .eq("id", baki.id);

    if (updateError) {
      console.error("Error updating baki:", updateError);
      showAlert("Error updating baki", "error");
      throw updateError;
    }
  }, [showAlert, trackOperation, isBakiEnabled]);

  const value = {
    bakis,
    addBaki,
    getOrCreateBaki,
    deleteBaki,
    updateBaki,
    updateBalanceWithTransaction,
    loading,
    currentUserBaki,
  };

  return (
    <BakiContext.Provider value={value}>
      {children}
    </BakiContext.Provider>
  );
}

export function useBakiContext() {
  const context = useContext(BakiContext);

  if (!context) {
    throw new Error('useBakiContext must be used within a BakiProvider');
  }

  return context;
}

