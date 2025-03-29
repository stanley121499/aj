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
import { useAccountBalanceContext } from "./AccountBalanceContext";
import { useBakiContext } from "./BakiContext";
import { useUserContext, User } from "./UserContext";
import { useTransactionContext } from "./TransactionContext";
import { createBalanceTransaction, createBakiTransaction, validateNote } from "../utils/noteUtils";
import { useRealtimeSubscription } from "../utils/useRealtimeSubscription";

export type Note = Database["public"]["Tables"]["notes"]["Row"];
export type Notes = { notes: Note[] };
export type NoteInsert = Database["public"]["Tables"]["notes"]["Insert"];

interface NoteContextProps {
  notes: Note[];
  addNote: (note: NoteInsert) => Promise<void>;
  deleteNote: (note: Note) => Promise<void>;
  updateNote: (note: Note) => Promise<void>;
  approveNote: (note: Note) => Promise<void>;
  rejectNote: (note: Note) => Promise<void>;
  loading: boolean;
}

const NoteContext = createContext<NoteContextProps>(undefined!);

type AlertType = "error" | "info" | "success" | "warning";

const handleNoteError = (
  error: unknown,
  operation: string,
  showAlert: (message: string, type: AlertType) => void
): void => {
  console.error(`Error ${operation}:`, error);
  showAlert(`Error ${operation}`, "error");
};

export function NoteProvider({ children }: Readonly<PropsWithChildren>) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const { showAlert } = useAlertContext();
  const { accountBalances, addAccountBalance } = useAccountBalanceContext();
  const { users } = useUserContext();
  const { addTransaction } = useTransactionContext();
  const { bakis, addBaki } = useBakiContext();

  useEffect(() => {
    const fetchNotes = async () => {
      const { data: fetchedNotes, error } = await supabase
        .from("notes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        handleNoteError(error, "fetching notes", showAlert);
      }

      setNotes(fetchedNotes || []);
      setLoading(false);
    };

    fetchNotes();
  }, [showAlert]);

  const handleRealtimeChanges = useCallback((payload: { eventType: string; new: Note; old: Note }) => {
    setNotes(prev => {
      switch (payload.eventType) {
        case 'INSERT':
          return [payload.new, ...prev];
        case 'UPDATE':
          return prev.map(note => note.id === payload.new.id ? payload.new : note);
        case 'DELETE':
          return prev.filter(note => note.id !== payload.old.id);
        default:
          return prev;
      }
    });
  }, []);

  const trackOperation = useRealtimeSubscription<Note>(
    { table: "notes" },
    handleRealtimeChanges
  );

  const addNote = useCallback(async (note: NoteInsert) => {
    try {
      const { data, error } = await supabase
        .from("notes")
        .insert(note)
        .select()
        .single();

      if (error) {
        handleNoteError(error, "adding note", showAlert);
        return;
      }

      if (data) {
        trackOperation({
          id: data.id,
          type: "INSERT",
          timestamp: Date.now(),
          data
        });
      }
    } catch (error) {
      handleNoteError(error, "adding note", showAlert);
    }
  }, [showAlert, trackOperation]);

  const deleteNote = useCallback(async (note: Note) => {
    try {
      trackOperation({
        id: note.id,
        type: "DELETE",
        timestamp: Date.now()
      });

      const { error } = await supabase
        .from("notes")
        .delete()
        .eq("id", note.id);

      if (error) {
        handleNoteError(error, "deleting note", showAlert);
      }
    } catch (error) {
      handleNoteError(error, "deleting note", showAlert);
    }
  }, [showAlert, trackOperation]);

  const updateNote = useCallback(async (note: Note) => {
    try {
      trackOperation({
        id: note.id,
        type: "UPDATE",
        timestamp: Date.now(),
        data: note
      });

      const { error } = await supabase
        .from("notes")
        .update(note)
        .eq("id", note.id);

      if (error) {
        handleNoteError(error, "updating note", showAlert);
      }
    } catch (error) {
      handleNoteError(error, "updating note", showAlert);
    }
  }, [showAlert, trackOperation]);

  const handleAccountBalanceNote = useCallback(async (user: User, note: Note) => {
    let accountBalance = accountBalances.find(
      (ab) => ab.user_id === user.id && ab.category_id === note.category_id
    );

    if (!accountBalance) {
      const newBalance = await addAccountBalance({
        user_id: user.id,
        category_id: note.category_id,
        balance: 0,
      });
      
      if (!newBalance) {
        throw new Error("Failed to create account balance");
      }
      accountBalance = newBalance;
    }

    const transaction = createBalanceTransaction(user, note, accountBalance);
    await addTransaction(transaction);
  }, [accountBalances, addAccountBalance, addTransaction]);

  const handleBakiNote = useCallback(async (user: User, note: Note) => {
    let baki = bakis.find(
      (b) => b.user_id === user.id && b.category_id === note.category_id
    );

    if (!baki) {
      const newBaki = await addBaki({
        user_id: user.id,
        category_id: note.category_id,
        balance: 0,
      });
      
      if (!newBaki) {
        throw new Error("Failed to create baki");
      }
      baki = newBaki;
    }

    const transaction = createBakiTransaction(user, note, baki);
    await addTransaction(transaction);
  }, [bakis, addBaki, addTransaction]);

  const approveNote = useCallback(async (note: Note) => {
    const user = users.find((u) => u.id === note.user_id);

    if (!user) {
      showAlert("User not found", "error");
      return;
    }

    try {
      validateNote(note);

      if (note.target === "account_balance") {
        await handleAccountBalanceNote(user, note);
      } else if (note.target === "baki") {
        await handleBakiNote(user, note);
      }

      await updateNote({
        ...note,
        status: "APPROVED",
      });

      showAlert("Note approved successfully", "success");
    } catch (error) {
      handleNoteError(error, "approving note", showAlert);
      throw error;
    }
  }, [users, showAlert, handleAccountBalanceNote, handleBakiNote, updateNote]);

  const rejectNote = useCallback(async (note: Note) => {
    try {
      await updateNote({
        ...note,
        status: "REJECTED",
      });
      showAlert("Note rejected successfully", "success");
    } catch (error) {
      handleNoteError(error, "rejecting note", showAlert);
    }
  }, [updateNote, showAlert]);

  const value = useMemo(() => ({
    notes,
    addNote,
    deleteNote,
    updateNote,
    approveNote,
    rejectNote,
    loading,
  }), [
    notes,
    addNote,
    deleteNote,
    updateNote,
    approveNote,
    rejectNote,
    loading,
  ]);

  return (
    <NoteContext.Provider value={value}>
      {children}
    </NoteContext.Provider>
  );
}

export function useNoteContext() {
  const context = useContext(NoteContext);

  if (!context) {
    throw new Error("useNoteContext must be used within a NoteProvider");
  }

  return context;
}
