import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  PropsWithChildren,
  useMemo,
  useCallback,
} from "react";
import { supabase } from "../utils/supabaseClient";
import { useAlertContext } from "./AlertContext";
import { useAccountBalanceContext } from "./AccountBalanceContext";
import { useBakiContext } from "./BakiContext";
import { Transaction, TransactionInsert } from "../types/transaction";
import { validateTransaction } from "../utils/transactionUtils";
import { useRealtimeSubscription } from "../utils/useRealtimeSubscription";

interface TransactionContextProps {
  transactions: Transaction[];
  addTransaction: (transaction: TransactionInsert) => Promise<void>;
  deleteTransaction: (transaction: Transaction, skipBalanceUpdate?: boolean) => Promise<void>;
  updateTransaction: (transaction: Transaction) => Promise<void>;
  loading: boolean;
}

const TransactionContext = createContext<TransactionContextProps>(undefined!);

export function TransactionProvider({ children }: Readonly<PropsWithChildren>) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { showAlert } = useAlertContext();
  const { accountBalances, updateBalanceWithTransaction: updateAccountBalanceWithTransaction } = useAccountBalanceContext();
  const { bakis, updateBalanceWithTransaction: updateBakiWithTransaction } = useBakiContext();

  useEffect(() => {
    const fetchTransactions = async () => {
      const { data: fetchedTransactions, error } = await supabase
        .from("transactions")
        .select("*")
        .order("id", { ascending: false });

      if (error) {
        console.error("Error fetching transactions:", error);
        showAlert("Error fetching transactions", "error");
      }

      setTransactions(fetchedTransactions || []);
      setLoading(false);
    };

    fetchTransactions();
  }, [showAlert]);

  const handleRealtimeChanges = useCallback((payload: { eventType: string; new: Transaction; old: Transaction }) => {
    setTransactions(prev => {
      switch (payload.eventType) {
        case 'INSERT':
          return [payload.new, ...prev];
        case 'UPDATE':
          return prev.map(transaction => transaction.id === payload.new.id ? payload.new : transaction);
        case 'DELETE':
          return prev.filter(transaction => transaction.id !== payload.old.id);
        default:
          return prev;
      }
    });
  }, []);

  const trackOperation = useRealtimeSubscription<Transaction>(
    { table: "transactions" },
    handleRealtimeChanges
  );

  const addTransaction = useCallback(async (transaction: TransactionInsert) => {
    try {
      const { data, error } = await supabase
        .from("transactions")
        .insert(transaction)
        .select()
        .single();

      if (error) {
        console.error("Error adding transaction:", error);
        showAlert("Error adding transaction", "error");
        return;
      }

      if (data) {
        if (transaction.target === "account_balance" && transaction.account_balance_id) {
          const { data: freshBalance, error: balanceError } = await supabase
            .from("account_balances")
            .select("*")
            .eq("id", transaction.account_balance_id)
            .single();

          if (balanceError) {
            console.error("Error fetching fresh balance:", balanceError);
            showAlert("Error updating balance", "error");
            return;
          }

          if (freshBalance) {
            await updateAccountBalanceWithTransaction(freshBalance, transaction.amount, transaction.type);
          }
        } else if (transaction.target === "baki" && transaction.baki_id) {
          const { data: freshBaki, error: bakiError } = await supabase
            .from("bakis")
            .select("*")
            .eq("id", transaction.baki_id)
            .single();

          if (bakiError) {
            console.error("Error fetching fresh baki:", bakiError);
            showAlert("Error updating baki", "error");
            return;
          }

          if (freshBaki) {
            await updateBakiWithTransaction(freshBaki, transaction.amount, transaction.type);
          }
        }

        trackOperation({
          id: data.id,
          type: "INSERT",
          timestamp: Date.now(),
          data
        });
      }
    } catch (error) {
      console.error("Error adding transaction:", error);
      showAlert("Error adding transaction", "error");
    }
  }, [showAlert, trackOperation, updateAccountBalanceWithTransaction, updateBakiWithTransaction]);

  const deleteTransaction = useCallback(async (transaction: Transaction, skipBalanceUpdate: boolean = false) => {
    try {
      trackOperation({
        id: transaction.id,
        type: "DELETE",
        timestamp: Date.now()
      });

      const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", transaction.id);

      if (error) {
        console.error("Error deleting transaction:", error);
        showAlert("Error deleting transaction", "error");
        return;
      }

      if (!skipBalanceUpdate) {
        if (transaction.target === "account_balance") {
          const accountBalance = accountBalances.find(
            (ab) => ab.id === transaction.account_balance_id
          );
          if (accountBalance) {
            await updateAccountBalanceWithTransaction(
              accountBalance,
              transaction.amount,
              transaction.type === "debit" ? "credit" : "debit"
            );
          }
        } else if (transaction.target === "baki") {
          const baki = bakis.find((b) => b.id === transaction.baki_id);
          if (baki) {
            await updateBakiWithTransaction(
              baki,
              transaction.amount,
              transaction.type === "debit" ? "credit" : "debit"
            );
          }
        }
      }
    } catch (error) {
      console.error("Error deleting transaction:", error);
      showAlert("Error deleting transaction", "error");
    }
  }, [showAlert, trackOperation, accountBalances, bakis, updateAccountBalanceWithTransaction, updateBakiWithTransaction]);

  const updateTransaction = useCallback(async (transaction: Transaction) => {
    try {
      trackOperation({
        id: transaction.id,
        type: "UPDATE",
        timestamp: Date.now(),
        data: transaction
      });

      const { error } = await supabase
        .from("transactions")
        .update(transaction)
        .eq("id", transaction.id);

      if (error) {
        console.error("Error updating transaction:", error);
        showAlert("Error updating transaction", "error");
      }
    } catch (error) {
      console.error("Error updating transaction:", error);
      showAlert("Error updating transaction", "error");
    }
  }, [showAlert, trackOperation]);

  const value = useMemo(() => ({
    transactions,
    addTransaction,
    deleteTransaction,
    updateTransaction,
    loading,
  }), [transactions, addTransaction, deleteTransaction, updateTransaction, loading]);

  return (
    <TransactionContext.Provider value={value}>
      {children}
    </TransactionContext.Provider>
  );
}

export function useTransactionContext() {
  const context = useContext(TransactionContext);

  if (!context) {
    throw new Error("useTransactionContext must be used within a TransactionProvider");
  }

  return context;
}

export type { Transaction, TransactionInsert };
