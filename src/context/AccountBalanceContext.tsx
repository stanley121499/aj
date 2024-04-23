import React, { createContext, useContext, useEffect, useState, PropsWithChildren } from "react";
import { supabase } from "../utils/supabaseClient";
import { Database } from "../../database.types";
import { useAlertContext } from "./AlertContext";

export type AccountBalance = Database['public']['Tables']['account_balances']['Row'];
export type AccountBalances = { accountBalances: AccountBalance[] };

interface AccountBalanceContextProps {
  accountBalances: AccountBalance[];
  addAccountBalance: (accountBalance: AccountBalance) => void;
  deleteAccountBalance: (accountBalance: AccountBalance) => void;
  updateAccountBalance: (accountBalance: AccountBalance) => void;
  loading: boolean;
}

const AccountBalanceContext = createContext<AccountBalanceContextProps>(undefined!);

export function AccountBalanceProvider({ children }: PropsWithChildren) {
  const [accountBalances, setAccountBalances] = useState<AccountBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const { showAlert } = useAlertContext();

  useEffect(() => {
    const fetchAccountBalances = async () => {
      const { data: accountBalances, error } = await supabase
        .from('account_balances')
        .select('*');

      if (error) {
        console.error('Error fetching account balances:', error);
        showAlert('Error fetching account balances', 'error');
      }

      setAccountBalances(accountBalances || []);
      setLoading(false);
    };

    fetchAccountBalances();

    const handleChanges = (payload: any) => {
      if (payload.eventType === 'INSERT') {
        setAccountBalances(prev => [payload.new, ...prev]);
      } else if (payload.eventType === 'UPDATE') {
        setAccountBalances(prev => prev.map(accountBalance => accountBalance.id === payload.new.id ? payload.new : accountBalance));
      } else if (payload.eventType === 'DELETE') {
        setAccountBalances(prev => prev.filter(accountBalance => accountBalance.id !== payload.old.id));
      }
    };

    const subscription = supabase
      .channel('account_balances')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'account_balances' }, payload => {
        handleChanges(payload);
      })
      .subscribe();

    setLoading(false);

    return () => {
      subscription.unsubscribe();
    };
  }, [showAlert]);

  const addAccountBalance = async (accountBalance: AccountBalance) => {
    const { data, error } = await supabase
      .from('account_balances')
      .insert(accountBalance);

    if (error) {
      console.error('Error adding account balance:', error);
      showAlert('Error adding account balance', 'error');
      return;
    }

    setAccountBalances(prev => [data![0], ...prev]);
  };

  const deleteAccountBalance = async (accountBalance: AccountBalance) => {
    const { error } = await supabase
      .from('account_balances')
      .delete()
      .eq('id', accountBalance.id);

    if (error) {
      console.error('Error deleting account balance:', error);
      showAlert('Error deleting account balance', 'error');
      return;
    }
  }

  const updateAccountBalance = async (accountBalance: AccountBalance) => {
    const { error } = await supabase
      .from('account_balances')
      .update(accountBalance)
      .eq('id', accountBalance.id);

    if (error) {
      console.error('Error updating account balance:', error);
      showAlert('Error updating account balance', 'error');
      return;
    }
  }

  return (
    <AccountBalanceContext.Provider value={{ accountBalances, addAccountBalance, deleteAccountBalance, updateAccountBalance, loading }}>
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