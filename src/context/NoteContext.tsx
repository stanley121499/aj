import React, { createContext, useContext, useEffect, useState, PropsWithChildren } from "react";
import { supabase } from "../utils/supabaseClient";
import { Database } from "../../database.types";
import { useAlertContext } from "./AlertContext";

export type Note = Database['public']['Tables']['notes']['Row'];
export type Notes = { notes: Note[] };

interface NoteContextProps {
  notes: Note[];
  addNote: (note: Note) => void;
  deleteNote: (note: Note) => void;
  updateNote: (note: Note) => void;
  loading: boolean;
}

const NoteContext = createContext<NoteContextProps>(undefined!);

export function NoteProvider({ children }: PropsWithChildren) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const { showAlert } = useAlertContext();

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

  const addNote = async (note: Note) => {
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

  return (
    <NoteContext.Provider value={{ notes, addNote, deleteNote, updateNote, loading }}>
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