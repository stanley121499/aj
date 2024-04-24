import React, { createContext, useContext, useEffect, useState, PropsWithChildren } from "react";
import { supabase } from "../utils/supabaseClient";
import { Database } from "../../database.types";
import { useAlertContext } from "./AlertContext";
import { useAccountBalanceContext } from "./AccountBalanceContext";
import { useUserContext } from "./UserContext";
import { useTransactionContext, TransactionInsert } from "./TransactionContext";

export type Note = Database['public']['Tables']['notes']['Row'];
export type Notes = { notes: Note[] };
export type NoteInsert = Database['public']['Tables']['notes']['Insert'];

interface NoteContextProps {
  notes: Note[];
  addNote: (note: NoteInsert) => void;
  deleteNote: (note: Note) => void;
  updateNote: (note: Note) => void;
  approveNote: (note: Note) => void;
  loading: boolean;
}

const NoteContext = createContext<NoteContextProps>(undefined!);

export function NoteProvider({ children }: PropsWithChildren) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const { showAlert } = useAlertContext();
  const { accountBalances } = useAccountBalanceContext();
  const { users } = useUserContext();
  const { addTransaction } = useTransactionContext();

  useEffect(() => {
    const fetchNotes = async () => {
      const { data: notes, error } = await supabase
        .from('notes')
        .select('*');

      if (error) {
        console.error('Error fetching notes:', error);
        showAlert('Error fetching notes', 'error');
      }

      setNotes(notes || []);
      setLoading(false);
    };

    fetchNotes();

    const handleChanges = (payload: any) => {
      if (payload.eventType === 'INSERT') {
        setNotes(prev => [payload.new, ...prev]);
      } else if (payload.eventType === 'UPDATE') {
        setNotes(prev => prev.map(note => note.id === payload.new.id ? payload.new : note));
      } else if (payload.eventType === 'DELETE') {
        setNotes(prev => prev.filter(note => note.id !== payload.old.id));
      }
    };

    const subscription = supabase
      .channel('notes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notes' }, payload => {
        handleChanges(payload);
      })
      .subscribe();

    setLoading(false);
    return () => {
      subscription.unsubscribe();
    };
  }, [showAlert]);

  const addNote = async (note: NoteInsert) => {
    const { error } = await supabase
      .from('notes')
      .insert(note);

    if (error) {
      console.error('Error adding note:', error);
      showAlert('Error adding note', 'error');
      return;
    }
  };

  const deleteNote = async (note: Note) => {
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', note.id);

    if (error) {
      console.error('Error deleting note:', error);
      showAlert('Error deleting note', 'error');
      return;
    }
  };

  const updateNote = async (note: Note) => {
    const { error } = await supabase
      .from('notes')
      .update(note)
      .eq('id', note.id);

    if (error) {
      console.error('Error updating note:', error);
      showAlert('Error updating note', 'error');
      return;
    }
  };

  const approveNote = async (note: Note) => {
    const user = users.find(user => user.id === note.user_id);

    if (!user) {
      console.error('User not found');
      showAlert('User not found', 'error');
      return;
    }

    const accountBalance = accountBalances.find(ab => ab.user_id === user.id);

    if (!accountBalance) {
      console.error('Account balance not found');
      showAlert('Account balance not found', 'error');
      return;
    }
    
    const transaction: TransactionInsert = {
      account_balance_id: accountBalance.id,
      amount: note.amount,
      type: 'credit',
      target: 'account_balance',
    };

    addTransaction(transaction);

    await updateNote({
      ...note,
      status: 'APPROVED',
    });

  }

  return (
    <NoteContext.Provider value={{ notes, addNote, deleteNote, updateNote, approveNote, loading }}>
      {children}
    </NoteContext.Provider>
  );
}

export function useNoteContext() {
  const context = useContext(NoteContext);

  if (!context) {
    throw new Error('useNoteContext must be used within a NoteProvider');
  }

  return context;
}