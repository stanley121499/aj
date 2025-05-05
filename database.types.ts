export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      account_balances: {
        Row: {
          balance: number
          category_id: number
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          balance: number
          category_id: number
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          balance?: number
          category_id?: number
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "public_account_balance_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      bakis: {
        Row: {
          balance: number
          category_id: number
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          balance: number
          category_id: number
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          balance?: number
          category_id?: number
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "baki_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          id: number
          name: string
        }
        Insert: {
          id?: number
          name: string
        }
        Update: {
          id?: number
          name?: string
        }
        Relationships: []
      }
      notes: {
        Row: {
          amount: number
          category_id: number
          created_at: string
          id: string
          media_url: string | null
          method: string
          remarks: string | null
          status: string
          target: Database["public"]["Enums"]["transaction_target"]
          user_id: string
        }
        Insert: {
          amount: number
          category_id: number
          created_at?: string
          id?: string
          media_url?: string | null
          method: string
          remarks?: string | null
          status?: string
          target: Database["public"]["Enums"]["transaction_target"]
          user_id: string
        }
        Update: {
          amount?: number
          category_id?: number
          created_at?: string
          id?: string
          media_url?: string | null
          method?: string
          remarks?: string | null
          status?: string
          target?: Database["public"]["Enums"]["transaction_target"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "public_notes_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      results: {
        Row: {
          category_id: number
          created_at: string
          id: number
          result: string
          status: string
          target: Database["public"]["Enums"]["transaction_target"]
          user_id: string
        }
        Insert: {
          category_id: number
          created_at?: string
          id?: number
          result: string
          status?: string
          target: Database["public"]["Enums"]["transaction_target"]
          user_id: string
        }
        Update: {
          category_id?: number
          created_at?: string
          id?: number
          result?: string
          status?: string
          target?: Database["public"]["Enums"]["transaction_target"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "public_results_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          account_balance_id: string | null
          amount: number
          baki_id: string | null
          category_id: number
          created_at: string
          id: number
          note_id: string | null
          result_id: number | null
          source: string | null
          target: Database["public"]["Enums"]["transaction_target"]
          type: string
          user_id: string
        }
        Insert: {
          account_balance_id?: string | null
          amount: number
          baki_id?: string | null
          category_id: number
          created_at?: string
          id?: number
          note_id?: string | null
          result_id?: number | null
          source?: string | null
          target: Database["public"]["Enums"]["transaction_target"]
          type: string
          user_id: string
        }
        Update: {
          account_balance_id?: string | null
          amount?: number
          baki_id?: string | null
          category_id?: number
          created_at?: string
          id?: number
          note_id?: string | null
          result_id?: number | null
          source?: string | null
          target?: Database["public"]["Enums"]["transaction_target"]
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "public_transaction_account_balance_id_fkey"
            columns: ["account_balance_id"]
            isOneToOne: false
            referencedRelation: "account_balances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_baki_id_fkey"
            columns: ["baki_id"]
            isOneToOne: false
            referencedRelation: "bakis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_result_id_fkey"
            columns: ["result_id"]
            isOneToOne: false
            referencedRelation: "results"
            referencedColumns: ["id"]
          },
        ]
      }
      user_details: {
        Row: {
          birthday: string | null
          contact_number: string | null
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          birthday?: string | null
          contact_number?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          birthday?: string | null
          contact_number?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      transaction_target: "baki" | "account_balance"
      user_role: "customer" | "employee" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      transaction_target: ["baki", "account_balance"],
      user_role: ["customer", "employee", "admin"],
    },
  },
} as const
