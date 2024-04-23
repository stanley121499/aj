import React, { createContext, useContext, useEffect, useState, PropsWithChildren } from "react";
import { supabase } from "../utils/supabaseClient";
import { Database } from "../../database.types";
import { useAlertContext } from "./AlertContext";

export type Result = Database['public']['Tables']['results']['Row'];
export type Results = { results: Result[] };

interface ResultContextProps {
  results: Result[];
  addResult: (result: Result) => void;
  deleteResult: (result: Result) => void;
  updateResult: (result: Result) => void;
  loading: boolean;
}

const ResultContext = createContext<ResultContextProps>(undefined!);

export function ResultProvider({ children }: PropsWithChildren) {
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const { showAlert } = useAlertContext();

  useEffect(() => {
    const fetchResults = async () => {
      const { data: results, error } = await supabase
        .from('results')
        .select('*');

      if (error) {
        console.error('Error fetching results:', error);
        showAlert('Error fetching results', 'error');
      }

      setResults(results || []);
      setLoading(false);
    };

    fetchResults();

    const handleChanges = (payload: any) => {
      if (payload.eventType === 'INSERT') {
        setResults(prev => [payload.new, ...prev]);
      } else if (payload.eventType === 'UPDATE') {
        setResults(prev => prev.map(result => result.id === payload.new.id ? payload.new : result));
      } else if (payload.eventType === 'DELETE') {
        setResults(prev => prev.filter(result => result.id !== payload.old.id));
      }
    };

    const subscription = supabase
      .channel('results')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'results' }, payload => {
        handleChanges(payload);
      })
      .subscribe();

    setLoading(false);
    return () => {
      subscription.unsubscribe();
    };
  }, [showAlert]);

  const addResult = async (result: Result) => {
    const { data, error } = await supabase
      .from('results')
      .insert(result);

    if (error) {
      console.error('Error adding result:', error);
      showAlert('Error adding result', 'error');
      return;
    }

    setResults(prev => [data![0], ...prev]);
  };

  const deleteResult = async (result: Result) => {
    const { error } = await supabase
      .from('results')
      .delete()
      .eq('id', result.id);

    if (error) {
      console.error('Error deleting result:', error);
      showAlert('Error deleting result', 'error');
      return;
    }

    setResults(prev => prev.filter(r => r.id !== result.id));
  };

  const updateResult = async (result: Result) => {
    const { error } = await supabase
      .from('results')
      .update(result)
      .eq('id', result.id);

    if (error) {
      console.error('Error updating result:', error);
      showAlert('Error updating result', 'error');
      return;
    }
  }

  return (
    <ResultContext.Provider value={{ results, addResult, deleteResult, updateResult, loading }}>
      {children}
    </ResultContext.Provider>
  );
}

export function useResultContext() {
  const context = useContext(ResultContext);

  if (!context) {
    throw new Error('useResultContext must be used within a ResultProvider');
  }

  return context;
}