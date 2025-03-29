import React, { createContext, useContext, useEffect, useState, PropsWithChildren, useCallback } from "react";
import { supabase } from "../utils/supabaseClient";
import { Database } from "../../database.types";
import { useAlertContext } from "./AlertContext";
import { useRealtimeSubscription } from "../utils/useRealtimeSubscription";

export type Category = Database['public']['Tables']['categories']['Row'];
export type Categories = { categories: Category[] };
export type CategoryInsert = Database['public']['Tables']['categories']['Insert'];

interface CategoryContextProps {
  categories: Category[];
  addCategory: (category: CategoryInsert) => Promise<void>;
  deleteCategory: (category: Category) => Promise<void>;
  updateCategory: (category: Category) => Promise<void>;
  loading: boolean;
}

const CategoryContext = createContext<CategoryContextProps>(undefined!);

export function CategoryProvider({ children }: PropsWithChildren) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const { showAlert } = useAlertContext();

  useEffect(() => {
    const fetchCategories = async () => {
      const { data: categories, error } = await supabase
        .from('categories')
        .select('*')
        .order('id', { ascending: false });

      if (error) {
        console.error('Error fetching categories:', error);
        showAlert('Error fetching categories', 'error');
      }

      setCategories(categories || []);
      setLoading(false);
    };

    fetchCategories();
  }, [showAlert]);

  const handleRealtimeChanges = useCallback((payload: { eventType: string; new: Category; old: Category }) => {
    setCategories(prev => {
      switch (payload.eventType) {
        case 'INSERT':
          return [payload.new, ...prev];
        case 'UPDATE':
          return prev.map(category => category.id === payload.new.id ? payload.new : category);
        case 'DELETE':
          return prev.filter(category => category.id !== payload.old.id);
        default:
          return prev;
      }
    });
  }, []);

  const trackOperation = useRealtimeSubscription<Category>(
    { table: "categories" },
    handleRealtimeChanges
  );

  const addCategory = useCallback(async (category: CategoryInsert) => {
    const { data, error } = await supabase
      .from('categories')
      .insert(category)
      .select()
      .single();

    if (error) {
      console.error('Error adding category:', error);
      showAlert('Error adding category', 'error');
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
  }, [showAlert, trackOperation]);

  const deleteCategory = useCallback(async (category: Category) => {
    trackOperation({
      id: category.id,
      type: "DELETE",
      timestamp: Date.now()
    });

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', category.id);

    if (error) {
      console.error('Error deleting category:', error);
      showAlert('Error deleting category', 'error');
    }
  }, [showAlert, trackOperation]);

  const updateCategory = useCallback(async (category: Category) => {
    trackOperation({
      id: category.id,
      type: "UPDATE",
      timestamp: Date.now(),
      data: category
    });

    const { error } = await supabase
      .from('categories')
      .update(category)
      .eq('id', category.id);

    if (error) {
      console.error('Error updating category:', error);
      showAlert('Error updating category', 'error');
    }
  }, [showAlert, trackOperation]);

  const value = {
    categories,
    addCategory,
    deleteCategory,
    updateCategory,
    loading,
  };

  return (
    <CategoryContext.Provider value={value}>
      {children}
    </CategoryContext.Provider>
  );
}

export function useCategoryContext() {
  const context = useContext(CategoryContext);

  if (!context) {
    throw new Error('useCategoryContext must be used within a CategoryProvider');
  }

  return context;
}