import React, { createContext, useContext, useEffect, useState, PropsWithChildren } from "react";
import { supabase } from "../utils/supabaseClient";
import { Database } from "../../database.types";
import { useAlertContext } from "./AlertContext";

export type Transaction = Database['public']['Tables']['transactions']['Row'];
export type Transactions = { transactions: Transaction[] };

interface TransactionContextProps {
  transactions: Transaction[];
  addTransaction: (transaction: Transaction) => void;
  deleteTransaction: (transaction: Transaction) => void;
  updateTransaction: (transaction: Transaction) => void;
  loading: boolean;
}

const TransactionContext = createContext<TransactionContextProps>(undefined!);

export function TransactionProvider({ children }: PropsWithChildren) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { showAlert } = useAlertContext();

  useEffect(() => {
    const fetchTransactions = async () => {
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('*');

      if (error) {
        console.error('Error fetching transactions:', error);
        showAlert('Error fetching transactions', 'error');
      }

      setTransactions(transactions || []);
      setLoading(false);
    };

    fetchTransactions();

    const handleChanges = (payload: any) => {
      if (payload.eventType === 'INSERT') {
        setTransactions(prev => [payload.new, ...prev]);
      } else if (payload.eventType === 'UPDATE') {
        setTransactions(prev => prev.map(transaction => transaction.id === payload.new.id ? payload.new : transaction));
      } else if (payload.eventType === 'DELETE') {
        setTransactions(prev => prev.filter(transaction => transaction.id !== payload.old.id));
      }
    };

    const subscription = supabase
      .channel('transactions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, payload => {
        handleChanges(payload);
      })
      .subscribe();

    setLoading(false);

    return () => {
      subscription.unsubscribe();
    };

  }, [showAlert]);

  const addTransaction = async (transaction: Transaction) => {
    const { error } = await supabase
      .from('transactions')
      .insert(transaction);

    if (error) {
      console.error('Error adding transaction:', error);
      showAlert('Error adding transaction', 'error');
      return;
    }
  };

  const deleteTransaction = async (transaction: Transaction) => {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', transaction.id);

    if (error) {
      console.error('Error deleting transaction:', error);
      showAlert('Error deleting transaction', 'error');
      return;
    }
  };

  const updateTransaction = async (transaction: Transaction) => {
    const { error } = await supabase
      .from('transactions')
      .update(transaction)
      .eq('id', transaction.id);

    if (error) {
      console.error('Error updating transaction:', error);
      showAlert('Error updating transaction', 'error');
      return;
    }
  };

  return (
    <TransactionContext.Provider value={{ transactions, addTransaction, deleteTransaction, updateTransaction, loading }}>
      {children}
    </TransactionContext.Provider>
  );
}

export function useTransactionContext() {
  const context = useContext(TransactionContext);

  if (!context) {
    throw new Error('useTransactionContext must be used within a TransactionProvider');
  }

  return context;
}