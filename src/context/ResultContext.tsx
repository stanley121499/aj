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
import { Database } from "../../database.types";
import { useAlertContext } from "./AlertContext";
import { useTransactionContext, Transaction } from "./TransactionContext";
import { useUserContext } from "./UserContext";
import { useBakiContext } from "./BakiContext";
import { useAccountBalanceContext } from "./AccountBalanceContext";
import { parseResultLines } from "../utils/resultParser";
import { createTransactionFromResult } from "../utils/transactionCreator";
import { useRealtimeSubscription } from "../utils/useRealtimeSubscription";

export type Result = Database["public"]["Tables"]["results"]["Row"];
export type Results = { results: Result[] };
export type ResultInsert = Database["public"]["Tables"]["results"]["Insert"];

interface ResultContextProps {
  results: readonly Result[];
  addResult: (result: ResultInsert) => Promise<void>;
  deleteResult: (result: Result) => Promise<void>;
  updateResult: (result: Result) => Promise<void>;
  loading: boolean;
}

const ResultContext = createContext<ResultContextProps>(undefined!);

export function ResultProvider({ children }: PropsWithChildren) {
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const { showAlert } = useAlertContext();
  const { addTransaction, transactions, deleteTransaction } = useTransactionContext();
  const { users } = useUserContext();
  const { getOrCreateBaki } = useBakiContext();
  const { getOrCreateAccountBalance } = useAccountBalanceContext();

  useEffect(() => {
    const fetchResults = async () => {
      const { data: results, error } = await supabase
        .from("results")
        .select("*")
        .order("id", { ascending: false });

      if (error) {
        console.error("Error fetching results:", error);
        showAlert("Error fetching results", "error");
      }

      setResults(results || []);
      setLoading(false);
    };

    fetchResults();
  }, [showAlert]);

  const handleRealtimeChanges = useCallback((payload: { eventType: string; new: Result; old: Result }) => {
    setResults(prev => {
      switch (payload.eventType) {
        case 'INSERT':
          return [payload.new, ...prev];
        case 'UPDATE':
          return prev.map(result => result.id === payload.new.id ? payload.new : result);
        case 'DELETE':
          return prev.filter(result => result.id !== payload.old.id);
        default:
          return prev;
      }
    });
  }, []);

  const trackOperation = useRealtimeSubscription<Result>(
    { table: "results" },
    handleRealtimeChanges
  );

  const processResult = useCallback(async (result: ResultInsert, resultId: number): Promise<void> => {
    if (!result.result || !result.category_id || !result.target) {
      throw new Error("Missing required result fields");
    }

    const parsedLines = parseResultLines(result.result);
    console.log("Processing result lines:", parsedLines);
    console.log("Total users available:", users.length);

    // Get fresh account balances before processing
    const { data: freshAccountBalances, error: balanceError } = await supabase
      .from("account_balances")
      .select("*");

    if (balanceError) {
      console.error("Error fetching fresh account balances:", balanceError);
      throw balanceError;
    }

    // Get fresh bakis before processing
    const { data: freshBakis, error: bakiError } = await supabase
      .from("bakis")
      .select("*");

    if (bakiError) {
      console.error("Error fetching fresh bakis:", bakiError);
      throw bakiError;
    }

    console.log("Fresh balances fetched:", {
      accountBalances: freshAccountBalances?.length,
      bakis: freshBakis?.length
    });

    for (const parsedLine of parsedLines) {
      console.log("\nProcessing line:", parsedLine);
      
      // Find user by username (email without @fruitcalculator.com)
      const user = users.find((u) => {
        const emailUsername = u.email.split("@")[0].toLowerCase();
        const parsedUsername = parsedLine.username.toLowerCase();
        return emailUsername === parsedUsername;
      });

      if (!user) {
        console.log("User lookup failed for:", parsedLine.username);
        console.log("Available usernames:", users.map(u => ({
          username: u.email.split("@")[0].toLowerCase(),
          fullEmail: u.email
        })));
        throw new Error(`User not found: ${parsedLine.username}`);
      }

      console.log("Found user:", {
        id: user.id,
        email: user.email,
        username: user.email.split("@")[0]
      });

      // Get or create the appropriate balance using fresh data
      if (result.target === "account_balance") {
        console.log("Processing account balance for user:", user.id);
        let accountBalance = freshAccountBalances?.find(
          ab => ab.user_id === user.id && ab.category_id === result.category_id
        );

        if (!accountBalance) {
          accountBalance = await getOrCreateAccountBalance(
            user.id,
            result.category_id
          );
        }

        console.log("Using account balance:", {
          id: accountBalance.id,
          userId: accountBalance.user_id,
          categoryId: accountBalance.category_id,
          balance: accountBalance.balance
        });

        const transaction = createTransactionFromResult(
          parsedLine,
          user.id,
          result.category_id,
          "account_balance",
          resultId,
          accountBalance
        );

        await addTransaction(transaction);
      } else if (result.target === "baki") {
        console.log("Processing baki for user:", user.id);
        let baki = freshBakis?.find(
          b => b.user_id === user.id && b.category_id === result.category_id
        );

        if (!baki) {
          baki = await getOrCreateBaki(
            user.id,
            result.category_id
          );
        }

        console.log("Using baki:", {
          id: baki.id,
          userId: baki.user_id,
          categoryId: baki.category_id,
          balance: baki.balance
        });

        const transaction = createTransactionFromResult(
          parsedLine,
          user.id,
          result.category_id,
          "baki",
          resultId,
          undefined,
          baki
        );

        await addTransaction(transaction);
      }
    }
  }, [addTransaction, getOrCreateAccountBalance, getOrCreateBaki, users]);

  const addResult = useCallback(async (result: ResultInsert) => {
    setLoading(true);
    let createdResult: Result | null = null;

    try {
      const { data, error } = await supabase
        .from("results")
        .insert(result)
        .select("*")
        .single();

      if (error) throw error;
      if (!data) throw new Error("No data returned from insert");

      createdResult = data;
      if (!createdResult) throw new Error("Failed to create result");

      trackOperation({
        id: createdResult.id,
        type: "INSERT",
        timestamp: Date.now(),
        data: createdResult
      });

      await processResult(result, createdResult.id);
      showAlert("Result processed successfully", "success");
    } catch (error) {
      console.error("Error adding result:", error);
      showAlert(error instanceof Error ? error.message : "Error adding result", "error");
      
      if (createdResult?.id) {
        await supabase.from("results").delete().eq("id", createdResult.id);
      }
    } finally {
      setLoading(false);
    }
  }, [processResult, showAlert, trackOperation]);

  const deleteResult = useCallback(async (result: Result) => {
    setLoading(true);

    try {
      const oldTransactions = transactions.filter(
        (transaction) => transaction.result_id === result.id
      );

      for (const transaction of oldTransactions) {
        await deleteTransaction(transaction);
      }

      trackOperation({
        id: result.id,
        type: "DELETE",
        timestamp: Date.now()
      });

      const { error } = await supabase
        .from("results")
        .delete()
        .eq("id", result.id);

      if (error) throw error;

      showAlert("Result and associated transactions deleted successfully", "success");
    } catch (error) {
      console.error("Error deleting result:", error);
      showAlert(error instanceof Error ? error.message : "Error deleting result", "error");
    } finally {
      setLoading(false);
    }
  }, [transactions, deleteTransaction, showAlert, trackOperation]);

  const updateResult = useCallback(async (result: Result) => {
    setLoading(true);
    let originalTransactions: Transaction[] = [];

    try {
      originalTransactions = transactions.filter(
        (transaction) => transaction.result_id === result.id
      );

      // Delete transactions without updating balances since we're reprocessing
      for (const transaction of originalTransactions) {
        await deleteTransaction(transaction);
      }

      trackOperation({
        id: result.id,
        type: "UPDATE",
        timestamp: Date.now(),
        data: result
      });

      await processResult(result, result.id);

      const { error } = await supabase
        .from("results")
        .update(result)
        .eq("id", result.id);

      if (error) throw error;

      showAlert("Result updated successfully", "success");
    } catch (error) {
      console.error("Error updating result:", error);
      showAlert(error instanceof Error ? error.message : "Error updating result", "error");
      
      if (originalTransactions.length > 0) {
        for (const transaction of originalTransactions) {
          try {
            await addTransaction(transaction);
          } catch (restoreError) {
            console.error("Error restoring transaction:", restoreError);
            showAlert("Error restoring original state. Please check balances.", "error");
          }
        }
      }
    } finally {
      setLoading(false);
    }
  }, [transactions, processResult, showAlert, deleteTransaction, addTransaction, trackOperation]);

  const value = useMemo(() => ({
    results,
    addResult,
    deleteResult,
    updateResult,
    loading,
  }), [results, addResult, deleteResult, updateResult, loading]);

  return (
    <ResultContext.Provider value={value}>
      {children}
    </ResultContext.Provider>
  );
}

export function useResultContext() {
  const context = useContext(ResultContext);

  if (!context) {
    throw new Error("useResultContext must be used within a ResultProvider");
  }

  return context;
}
