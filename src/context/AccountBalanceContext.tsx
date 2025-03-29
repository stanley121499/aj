import React, { createContext, useContext, useEffect, useState, PropsWithChildren, useMemo, useCallback } from "react";
import { supabase } from "../utils/supabaseClient";
import { Database } from "../../database.types";
import { useAlertContext } from "./AlertContext";
import { useAuthContext } from "./AuthContext";
import { useRealtimeSubscription } from "../utils/useRealtimeSubscription";

export type AccountBalance = Database['public']['Tables']['account_balances']['Row'];
export type AccountBalances = { accountBalances: AccountBalance[] };
export type AccountBalanceInsert = Database['public']['Tables']['account_balances']['Insert'];

interface AccountBalanceContextProps {
  accountBalances: AccountBalance[];
  addAccountBalance: (accountBalance: AccountBalanceInsert) => Promise<AccountBalance | undefined>;
  getOrCreateAccountBalance: (userId: string, categoryId: number) => Promise<AccountBalance>;
  deleteAccountBalance: (accountBalance: AccountBalance) => Promise<void>;
  updateAccountBalance: (accountBalance: AccountBalance) => Promise<void>;
  updateBalanceWithTransaction: (accountBalance: AccountBalance, amount: number, type: "debit" | "credit") => Promise<void>;
  loading: boolean;
  currentUserAccountBalance: AccountBalance[];
}

const AccountBalanceContext = createContext<AccountBalanceContextProps>(undefined!);

export function AccountBalanceProvider({ children }: Readonly<PropsWithChildren>) {
  const [accountBalances, setAccountBalances] = useState<AccountBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const { showAlert } = useAlertContext();
  const { user } = useAuthContext();
  const [currentUserAccountBalance, setCurrentUserAccountBalance] = useState<AccountBalance[]>([]);

  useEffect(() => {
    const fetchAccountBalances = async () => {
      const { data: balances, error } = await supabase
        .from('account_balances')
        .select('*');

      if (error) {
        console.error('Error fetching account balances:', error);
        showAlert('Error fetching account balances', 'error');
      }

      setAccountBalances(balances || []);
      setCurrentUserAccountBalance(balances?.filter(accountBalance => accountBalance.user_id === user?.id) || []);
      setLoading(false);
    };

    fetchAccountBalances();
  }, [showAlert, user?.id]);

  const handleRealtimeChanges = useCallback((payload: { eventType: string; new: AccountBalance; old: AccountBalance }) => {
    setAccountBalances(prev => {
      switch (payload.eventType) {
        case 'INSERT':
          return [payload.new, ...prev];
        case 'UPDATE':
          return prev.map(accountBalance => 
            accountBalance.id === payload.new.id ? payload.new : accountBalance
          );
        case 'DELETE':
          return prev.filter(accountBalance => accountBalance.id !== payload.old.id);
        default:
          return prev;
      }
    });
  }, []);

  const trackOperation = useRealtimeSubscription<AccountBalance>(
    { table: "account_balances" },
    handleRealtimeChanges
  );

  const addAccountBalance = useCallback(async (accountBalance: AccountBalanceInsert) => {
    const { data, error } = await supabase
      .from('account_balances')
      .insert(accountBalance)
      .select()
      .single();

    if (error) {
      console.error('Error adding account balance:', error);
      showAlert('Error adding account balance', 'error');
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
  }, [showAlert, trackOperation]);

  const deleteAccountBalance = useCallback(async (accountBalance: AccountBalance) => {
    trackOperation({
      id: accountBalance.id,
      type: "DELETE",
      timestamp: Date.now()
    });

    const { error } = await supabase
      .from('account_balances')
      .delete()
      .eq('id', accountBalance.id);

    if (error) {
      console.error('Error deleting account balance:', error);
      showAlert('Error deleting account balance', 'error');
    }
  }, [showAlert, trackOperation]);

  const updateAccountBalance = useCallback(async (accountBalance: AccountBalance) => {
    trackOperation({
      id: accountBalance.id,
      type: "UPDATE",
      timestamp: Date.now(),
      data: accountBalance
    });

    const { error } = await supabase
      .from('account_balances')
      .update(accountBalance)
      .eq('id', accountBalance.id);

    if (error) {
      console.error('Error updating account balance:', error);
      showAlert('Error updating account balance', 'error');
    }
  }, [showAlert, trackOperation]);

  const getOrCreateAccountBalance = useCallback(async (userId: string, categoryId: number): Promise<AccountBalance> => {
    const existingBalance = accountBalances.find(
      (ab) => ab.user_id === userId && ab.category_id === categoryId
    );

    if (existingBalance) {
      return existingBalance;
    }

    const newBalance = await addAccountBalance({
      user_id: userId,
      category_id: categoryId,
      balance: 0,
    });

    if (!newBalance) {
      throw new Error(`Failed to create account balance for user: ${userId}`);
    }

    return newBalance;
  }, [accountBalances, addAccountBalance]);

  const updateBalanceWithTransaction = useCallback(async (accountBalance: AccountBalance, amount: number, type: "debit" | "credit") => {
    const balanceChange = type === "debit" ? amount : -amount;
    const newBalance = accountBalance.balance + balanceChange;
    const updatedBalance = { ...accountBalance, balance: newBalance };

    trackOperation({
      id: accountBalance.id,
      type: "UPDATE",
      timestamp: Date.now(),
      data: updatedBalance
    });

    const { error: updateError } = await supabase
      .from("account_balances")
      .update({ balance: newBalance })
      .eq("id", accountBalance.id);

    if (updateError) {
      console.error("Error updating account balance:", updateError);
      showAlert("Error updating account balance", "error");
      throw updateError;
    }
  }, [showAlert, trackOperation]);

  const value = useMemo(() => ({
    accountBalances,
    addAccountBalance,
    getOrCreateAccountBalance,
    deleteAccountBalance,
    updateAccountBalance,
    updateBalanceWithTransaction,
    loading,
    currentUserAccountBalance,
  }), [
    accountBalances,
    addAccountBalance,
    getOrCreateAccountBalance,
    deleteAccountBalance,
    updateAccountBalance,
    updateBalanceWithTransaction,
    loading,
    currentUserAccountBalance,
  ]);

  return (
    <AccountBalanceContext.Provider value={value}>
      {children}
    </AccountBalanceContext.Provider>
  );
}

export function useAccountBalanceContext() {
  const context = useContext(AccountBalanceContext);

  if (!context) {
    throw new Error('useAccountBalanceContext must be used within an AccountBalanceProvider');
  }

  return context;
}