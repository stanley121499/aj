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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
