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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      automation_logs: {
        Row: {
          created_at: string | null
          error_message: string | null
          execution_time_ms: number | null
          id: string
          input_data: Json | null
          model_used: string | null
          output_data: Json | null
          status: string
          task_type: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          input_data?: Json | null
          model_used?: string | null
          output_data?: Json | null
          status: string
          task_type: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          input_data?: Json | null
          model_used?: string | null
          output_data?: Json | null
          status?: string
          task_type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      automations: {
        Row: {
          automation_type: string
          category: string | null
          config: Json | null
          created_at: string
          description: string | null
          id: string
          is_premium: boolean | null
          name: string
          price_per_use: number | null
          status: string
          updated_at: string
        }
        Insert: {
          automation_type: string
          category?: string | null
          config?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          is_premium?: boolean | null
          name: string
          price_per_use?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          automation_type?: string
          category?: string | null
          config?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          is_premium?: boolean | null
          name?: string
          price_per_use?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      conversation_history: {
        Row: {
          content: string
          created_at: string
          id: string
          model: string | null
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          model?: string | null
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          model?: string | null
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      email_logs: {
        Row: {
          clicked_at: string | null
          email_type: string
          error_message: string | null
          id: string
          opened_at: string | null
          sent_at: string | null
          subject: string | null
          user_id: string | null
        }
        Insert: {
          clicked_at?: string | null
          email_type: string
          error_message?: string | null
          id?: string
          opened_at?: string | null
          sent_at?: string | null
          subject?: string | null
          user_id?: string | null
        }
        Update: {
          clicked_at?: string | null
          email_type?: string
          error_message?: string | null
          id?: string
          opened_at?: string | null
          sent_at?: string | null
          subject?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          created_at: string | null
          html_content: string
          id: string
          is_active: boolean | null
          name: string
          subject: string
          trigger_day: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          html_content: string
          id?: string
          is_active?: boolean | null
          name: string
          subject: string
          trigger_day?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          html_content?: string
          id?: string
          is_active?: boolean | null
          name?: string
          subject?: string
          trigger_day?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      file_metadata: {
        Row: {
          bucket_id: string | null
          created_at: string | null
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          mime_type: string | null
          user_id: string | null
        }
        Insert: {
          bucket_id?: string | null
          created_at?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          user_id?: string | null
        }
        Update: {
          bucket_id?: string | null
          created_at?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      playground_tools: {
        Row: {
          airtable_record_id: string | null
          airtable_synced: boolean | null
          config: Json | null
          created_at: string
          description: string | null
          id: string
          name: string
          tool_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          airtable_record_id?: string | null
          airtable_synced?: boolean | null
          config?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          tool_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          airtable_record_id?: string | null
          airtable_synced?: boolean | null
          config?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          tool_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pricing_tiers: {
        Row: {
          created_at: string | null
          description: string | null
          features: Json | null
          id: string
          is_premium: boolean | null
          name: string
          price_monthly: number
          price_per_use: number | null
          stripe_price_id: string | null
          stripe_product_id: string | null
          updated_at: string | null
          usage_limit_monthly: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          is_premium?: boolean | null
          name: string
          price_monthly: number
          price_per_use?: number | null
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          updated_at?: string | null
          usage_limit_monthly?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          is_premium?: boolean | null
          name?: string
          price_monthly?: number
          price_per_use?: number | null
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          updated_at?: string | null
          usage_limit_monthly?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          converted_at: string | null
          created_at: string | null
          email: string
          email_sequence_step: number | null
          full_name: string | null
          id: string
          last_email_sent_at: string | null
          trial_ends_at: string | null
          trial_started_at: string | null
          updated_at: string | null
        }
        Insert: {
          converted_at?: string | null
          created_at?: string | null
          email: string
          email_sequence_step?: number | null
          full_name?: string | null
          id: string
          last_email_sent_at?: string | null
          trial_ends_at?: string | null
          trial_started_at?: string | null
          updated_at?: string | null
        }
        Update: {
          converted_at?: string | null
          created_at?: string | null
          email?: string
          email_sequence_step?: number | null
          full_name?: string | null
          id?: string
          last_email_sent_at?: string | null
          trial_ends_at?: string | null
          trial_started_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      scrapers: {
        Row: {
          category: string | null
          config: Json | null
          created_at: string
          description: string | null
          id: string
          is_premium: boolean | null
          name: string
          price_per_use: number | null
          scraper_type: string
          status: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          config?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          is_premium?: boolean | null
          name: string
          price_per_use?: number | null
          scraper_type: string
          status?: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          config?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          is_premium?: boolean | null
          name?: string
          price_per_use?: number | null
          scraper_type?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_purchases: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          item_id: string
          item_type: string
          status: string
          stripe_payment_intent_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          item_id: string
          item_type: string
          status?: string
          stripe_payment_intent_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          item_id?: string
          item_type?: string
          status?: string
          stripe_payment_intent_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          pricing_tier_id: string | null
          status: string
          stripe_subscription_id: string | null
          updated_at: string | null
          usage_count: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          pricing_tier_id?: string | null
          status?: string
          stripe_subscription_id?: string | null
          updated_at?: string | null
          usage_count?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          pricing_tier_id?: string | null
          status?: string
          stripe_subscription_id?: string | null
          updated_at?: string | null
          usage_count?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_pricing_tier_id_fkey"
            columns: ["pricing_tier_id"]
            isOneToOne: false
            referencedRelation: "pricing_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { check_user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
