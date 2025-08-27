export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          account_id: string
          available_balance: number | null
          balance: number
          created_at: string
          credit_limit: number | null
          currency_code: string | null
          current_balance: number | null
          id: string
          institution_id: string | null
          institution_name: string | null
          mask: string | null
          name: string
          official_name: string | null
          plaid_account_id: string | null
          plaid_item_id: string | null
          plaid_item_id_ref: string | null
          source: string
          subtype: string | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id: string
          available_balance?: number | null
          balance?: number
          created_at?: string
          credit_limit?: number | null
          currency_code?: string | null
          current_balance?: number | null
          id?: string
          institution_id?: string | null
          institution_name?: string | null
          mask?: string | null
          name: string
          official_name?: string | null
          plaid_account_id?: string | null
          plaid_item_id?: string | null
          plaid_item_id_ref?: string | null
          source?: string
          subtype?: string | null
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string
          available_balance?: number | null
          balance?: number
          created_at?: string
          credit_limit?: number | null
          currency_code?: string | null
          current_balance?: number | null
          id?: string
          institution_id?: string | null
          institution_name?: string | null
          mask?: string | null
          name?: string
          official_name?: string | null
          plaid_account_id?: string | null
          plaid_item_id?: string | null
          plaid_item_id_ref?: string | null
          source?: string
          subtype?: string | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_guides: {
        Row: {
          content: string
          created_at: string
          id: string
          is_active: boolean
          slug: string
          tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_active?: boolean
          slug: string
          tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean
          slug?: string
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      bills: {
        Row: {
          amount: number
          created_at: string
          due_date: string
          id: string
          is_paid: boolean
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          due_date: string
          id?: string
          is_paid?: boolean
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          due_date?: string
          id?: string
          is_paid?: boolean
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      budget: {
        Row: {
          categories: Json | null
          created_at: string
          expenses: number
          id: string
          income: number
          status: string
          time_period: string
          updated_at: string
          user_id: string
        }
        Insert: {
          categories?: Json | null
          created_at?: string
          expenses?: number
          id?: string
          income?: number
          status?: string
          time_period?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          categories?: Json | null
          created_at?: string
          expenses?: number
          id?: string
          income?: number
          status?: string
          time_period?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      budget_shares: {
        Row: {
          access_logs: Json | null
          allowed_emails: string[] | null
          budget_data: Json
          created_at: string
          created_ip: unknown | null
          expires_at: string
          id: string
          last_accessed_at: string | null
          max_views: number | null
          requires_auth: boolean | null
          security_flags: Json | null
          token: string
          user_id: string
          view_count: number
        }
        Insert: {
          access_logs?: Json | null
          allowed_emails?: string[] | null
          budget_data: Json
          created_at?: string
          created_ip?: unknown | null
          expires_at?: string
          id?: string
          last_accessed_at?: string | null
          max_views?: number | null
          requires_auth?: boolean | null
          security_flags?: Json | null
          token: string
          user_id: string
          view_count?: number
        }
        Update: {
          access_logs?: Json | null
          allowed_emails?: string[] | null
          budget_data?: Json
          created_at?: string
          created_ip?: unknown | null
          expires_at?: string
          id?: string
          last_accessed_at?: string | null
          max_views?: number | null
          requires_auth?: boolean | null
          security_flags?: Json | null
          token?: string
          user_id?: string
          view_count?: number
        }
        Relationships: []
      }
      conversation_threads: {
        Row: {
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          attachments: Json | null
          created_at: string
          id: string
          message: string
          role: string
          thread_id: string | null
          user_id: string
        }
        Insert: {
          attachments?: Json | null
          created_at?: string
          id?: string
          message: string
          role: string
          thread_id?: string | null
          user_id: string
        }
        Update: {
          attachments?: Json | null
          created_at?: string
          id?: string
          message?: string
          role?: string
          thread_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      goal_tasks: {
        Row: {
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          goal_id: string
          id: string
          priority: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          goal_id: string
          id?: string
          priority?: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          goal_id?: string
          id?: string
          priority?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_tasks_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          created_at: string
          current_amount: number
          deadline: string | null
          goal_name: string
          id: string
          target_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_amount?: number
          deadline?: string | null
          goal_name: string
          id?: string
          target_amount: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_amount?: number
          deadline?: string | null
          goal_name?: string
          id?: string
          target_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      plaid_items: {
        Row: {
          available_products: string[] | null
          billed_products: string[] | null
          consent_expiration_time: string | null
          created_at: string
          id: string
          institution_id: string | null
          institution_name: string | null
          item_id: string
          last_synced_at: string | null
          products: string[] | null
          sync_cursor: string | null
          update_type: string | null
          updated_at: string
          user_id: string
          webhook: string | null
        }
        Insert: {
          available_products?: string[] | null
          billed_products?: string[] | null
          consent_expiration_time?: string | null
          created_at?: string
          id?: string
          institution_id?: string | null
          institution_name?: string | null
          item_id: string
          last_synced_at?: string | null
          products?: string[] | null
          sync_cursor?: string | null
          update_type?: string | null
          updated_at?: string
          user_id: string
          webhook?: string | null
        }
        Update: {
          available_products?: string[] | null
          billed_products?: string[] | null
          consent_expiration_time?: string | null
          created_at?: string
          id?: string
          institution_id?: string | null
          institution_name?: string | null
          item_id?: string
          last_synced_at?: string | null
          products?: string[] | null
          sync_cursor?: string | null
          update_type?: string | null
          updated_at?: string
          user_id?: string
          webhook?: string | null
        }
        Relationships: []
      }
      plaid_token_audit_log: {
        Row: {
          access_type: string
          created_at: string
          error_message: string | null
          function_name: string
          id: string
          ip_address: unknown | null
          success: boolean
          user_agent: string | null
          user_id: string
        }
        Insert: {
          access_type: string
          created_at?: string
          error_message?: string | null
          function_name: string
          id?: string
          ip_address?: unknown | null
          success?: boolean
          user_agent?: string | null
          user_id: string
        }
        Update: {
          access_type?: string
          created_at?: string
          error_message?: string | null
          function_name?: string
          id?: string
          ip_address?: unknown | null
          success?: boolean
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          app_id: string | null
          created_at: string
          encrypted_plaid_token: string | null
          has_connected_voice_ui: boolean
          id: string
          last_suspicious_access_at: string | null
          last_token_rotation: string | null
          security_alerts_enabled: boolean | null
          timezone: string | null
          token_access_count: number | null
          token_iv: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          app_id?: string | null
          created_at?: string
          encrypted_plaid_token?: string | null
          has_connected_voice_ui?: boolean
          id?: string
          last_suspicious_access_at?: string | null
          last_token_rotation?: string | null
          security_alerts_enabled?: boolean | null
          timezone?: string | null
          token_access_count?: number | null
          token_iv?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          app_id?: string | null
          created_at?: string
          encrypted_plaid_token?: string | null
          has_connected_voice_ui?: boolean
          id?: string
          last_suspicious_access_at?: string | null
          last_token_rotation?: string | null
          security_alerts_enabled?: boolean | null
          timezone?: string | null
          token_access_count?: number | null
          token_iv?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      share_send_log: {
        Row: {
          channel: string
          created_at: string
          error_message: string | null
          id: string
          ip_address: unknown | null
          recipient_masked: string
          share_id: string | null
          success: boolean
          user_agent: string | null
          user_id: string
        }
        Insert: {
          channel: string
          created_at?: string
          error_message?: string | null
          id?: string
          ip_address?: unknown | null
          recipient_masked: string
          share_id?: string | null
          success?: boolean
          user_agent?: string | null
          user_id: string
        }
        Update: {
          channel?: string
          created_at?: string
          error_message?: string | null
          id?: string
          ip_address?: unknown | null
          recipient_masked?: string
          share_id?: string | null
          success?: boolean
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      site_metrics: {
        Row: {
          id: number
          total_budgets: number
          total_transactions: number
          total_users: number
          updated_at: string
        }
        Insert: {
          id?: number
          total_budgets?: number
          total_transactions?: number
          total_users?: number
          updated_at?: string
        }
        Update: {
          id?: number
          total_budgets?: number
          total_transactions?: number
          total_users?: number
          updated_at?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          account_id: string | null
          amount: number
          authorized_date: string | null
          authorized_datetime: string | null
          category: string
          category_confidence: number | null
          category_model: string | null
          category_reason: string | null
          category_source: string | null
          created_at: string
          date: string
          datetime: string | null
          description: string
          id: string
          iso_currency_code: string | null
          location: Json | null
          merchant_name: string | null
          payment_meta: Json | null
          pending: boolean | null
          plaid_account_id: string | null
          plaid_transaction_id: string | null
          subcategory: string | null
          transaction_id: string | null
          unofficial_currency_code: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          authorized_date?: string | null
          authorized_datetime?: string | null
          category?: string
          category_confidence?: number | null
          category_model?: string | null
          category_reason?: string | null
          category_source?: string | null
          created_at?: string
          date: string
          datetime?: string | null
          description: string
          id?: string
          iso_currency_code?: string | null
          location?: Json | null
          merchant_name?: string | null
          payment_meta?: Json | null
          pending?: boolean | null
          plaid_account_id?: string | null
          plaid_transaction_id?: string | null
          subcategory?: string | null
          transaction_id?: string | null
          unofficial_currency_code?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          authorized_date?: string | null
          authorized_datetime?: string | null
          category?: string
          category_confidence?: number | null
          category_model?: string | null
          category_reason?: string | null
          category_source?: string | null
          created_at?: string
          date?: string
          datetime?: string | null
          description?: string
          id?: string
          iso_currency_code?: string | null
          location?: Json | null
          merchant_name?: string | null
          payment_meta?: Json | null
          pending?: boolean | null
          plaid_account_id?: string | null
          plaid_transaction_id?: string | null
          subcategory?: string | null
          transaction_id?: string | null
          unofficial_currency_code?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_memories: {
        Row: {
          category: string
          confidence: number
          created_at: string
          expires_at: string | null
          id: string
          importance: number
          is_deleted: boolean
          is_pinned: boolean
          key: string | null
          last_reinforced_at: string | null
          occurrences: number
          source: string | null
          tags: string[]
          thread_id: string | null
          updated_at: string
          user_id: string
          value: Json
        }
        Insert: {
          category: string
          confidence?: number
          created_at?: string
          expires_at?: string | null
          id?: string
          importance?: number
          is_deleted?: boolean
          is_pinned?: boolean
          key?: string | null
          last_reinforced_at?: string | null
          occurrences?: number
          source?: string | null
          tags?: string[]
          thread_id?: string | null
          updated_at?: string
          user_id: string
          value: Json
        }
        Update: {
          category?: string
          confidence?: number
          created_at?: string
          expires_at?: string | null
          id?: string
          importance?: number
          is_deleted?: boolean
          is_pinned?: boolean
          key?: string | null
          last_reinforced_at?: string | null
          occurrences?: number
          source?: string | null
          tags?: string[]
          thread_id?: string | null
          updated_at?: string
          user_id?: string
          value?: Json
        }
        Relationships: []
      }
      waitlist_email_log: {
        Row: {
          created_at: string
          email_masked: string
          error_message: string | null
          id: string
          ip_address: unknown | null
          success: boolean
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          email_masked: string
          error_message?: string | null
          id?: string
          ip_address?: unknown | null
          success?: boolean
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          email_masked?: string
          error_message?: string | null
          id?: string
          ip_address?: unknown | null
          success?: boolean
          user_agent?: string | null
        }
        Relationships: []
      }
      waitlist_signups: {
        Row: {
          created_at: string
          email: string
          id: string
          source: string | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          source?: string | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          source?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_auth_security_settings: {
        Args: Record<PropertyKey, never>
        Returns: {
          current_status: string
          recommended_status: string
          security_impact: string
          setting_name: string
        }[]
      }
      check_budget_share_rate_limit: {
        Args: { ip_address: string; share_id: string }
        Returns: boolean
      }
      check_link_token_rate: {
        Args: { target_user_id: string }
        Returns: boolean
      }
      check_share_send_rate: {
        Args: {
          channel_type: string
          request_ip?: unknown
          target_user_id: string
        }
        Returns: boolean
      }
      check_token_access_rate: {
        Args: { target_user_id: string }
        Returns: boolean
      }
      check_waitlist_email_rate: {
        Args: { email_param: string; ip_param: unknown }
        Returns: boolean
      }
      check_waitlist_rate_limit: {
        Args: { email_input: string; ip_input: unknown }
        Returns: boolean
      }
      clear_user_audit_logs: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      decrypt_plaid_token: {
        Args: { encrypted_data: Json; encryption_key: string }
        Returns: string
      }
      decrypt_plaid_token_with_audit: {
        Args:
          | {
              encrypted_data: Json
              encryption_key: string
              function_name?: string
              ip_address?: string
              target_user_id?: string
              user_agent?: string
            }
          | {
              encrypted_data: Json
              encryption_key: string
              function_name?: string
              ip_address?: string
              user_agent?: string
            }
        Returns: string
      }
      encrypt_plaid_token: {
        Args: { encryption_key?: string; token: string }
        Returns: Json
      }
      generate_secure_token: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_secure_profile: {
        Args: { target_user_id?: string }
        Returns: {
          app_id: string
          created_at: string
          has_connected_voice_ui: boolean
          has_plaid_connection: boolean
          last_suspicious_access_at: string
          last_token_rotation: string
          security_alerts_enabled: boolean
          timezone: string
          token_access_count: number
          updated_at: string
          user_id: string
        }[]
      }
      get_shared_budget_secure: {
        Args:
          | { client_ip?: string; share_token: string; user_email?: string }
          | { share_token: string; user_email?: string }
        Returns: Json
      }
      get_user_profile_secure: {
        Args: { target_user_id?: string }
        Returns: {
          app_id: string
          created_at: string
          has_connected_voice_ui: boolean
          has_plaid_connection: boolean
          last_suspicious_access_at: string
          last_token_rotation: string
          security_alerts_enabled: boolean
          timezone: string
          token_access_count: number
          updated_at: string
          user_id: string
        }[]
      }
      has_recent_waitlist_signup: {
        Args: { days_param?: number; email_param: string }
        Returns: boolean
      }
      increment_budget_share_view: {
        Args: { share_id: string }
        Returns: boolean
      }
      is_admin_user: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      log_budget_share_access: {
        Args:
          | { ip_address?: string; share_id: string; user_agent?: string }
          | {
              ip_address?: string
              share_id: string
              user_agent?: string
              user_email?: string
            }
        Returns: undefined
      }
      rotate_plaid_token: {
        Args: { target_user_id: string }
        Returns: boolean
      }
      validate_email_content: {
        Args: { content: string }
        Returns: boolean
      }
      validate_share_access: {
        Args: { request_ip?: string; share_token: string; user_email?: string }
        Returns: Json
      }
      validate_share_token_only: {
        Args: { share_token: string }
        Returns: boolean
      }
      validate_sms_content: {
        Args: { message: string; phone_number: string }
        Returns: boolean
      }
      validate_waitlist_email: {
        Args: { email_input: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
