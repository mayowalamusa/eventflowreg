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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          action: string
          actor_id: string
          created_at: string
          details: Json
          id: string
          target_id: string
          target_type: string
        }
        Insert: {
          action: string
          actor_id: string
          created_at?: string
          details?: Json
          id?: string
          target_id: string
          target_type: string
        }
        Update: {
          action?: string
          actor_id?: string
          created_at?: string
          details?: Json
          id?: string
          target_id?: string
          target_type?: string
        }
        Relationships: []
      }
      event_fields: {
        Row: {
          created_at: string
          event_id: string
          field_type: Database["public"]["Enums"]["field_type"]
          form_id: string | null
          help_text: string | null
          id: string
          is_required: boolean
          label: string
          options: Json
          placeholder: string | null
          sort_order: number
        }
        Insert: {
          created_at?: string
          event_id: string
          field_type?: Database["public"]["Enums"]["field_type"]
          form_id?: string | null
          help_text?: string | null
          id?: string
          is_required?: boolean
          label: string
          options?: Json
          placeholder?: string | null
          sort_order?: number
        }
        Update: {
          created_at?: string
          event_id?: string
          field_type?: Database["public"]["Enums"]["field_type"]
          form_id?: string | null
          help_text?: string | null
          id?: string
          is_required?: boolean
          label?: string
          options?: Json
          placeholder?: string | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "event_fields_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_fields_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "registration_forms"
            referencedColumns: ["id"]
          },
        ]
      }
      event_tickets: {
        Row: {
          created_at: string
          currency: string
          description: string | null
          event_id: string
          id: string
          is_active: boolean
          metadata: Json
          name: string
          price_cents: number
          quantity_sold: number
          quantity_total: number | null
          sales_end_at: string | null
          sales_start_at: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          description?: string | null
          event_id: string
          id?: string
          is_active?: boolean
          metadata?: Json
          name: string
          price_cents?: number
          quantity_sold?: number
          quantity_total?: number | null
          sales_end_at?: string | null
          sales_start_at?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          description?: string | null
          event_id?: string
          id?: string
          is_active?: boolean
          metadata?: Json
          name?: string
          price_cents?: number
          quantity_sold?: number
          quantity_total?: number | null
          sales_end_at?: string | null
          sales_start_at?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_tickets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          archived_at: string | null
          banner_url: string | null
          base_price_cents: number
          capacity: number | null
          category: string | null
          certificates_enabled: boolean
          checkin_enabled: boolean
          created_at: string
          currency: string
          description: string | null
          destination_type: Database["public"]["Enums"]["destination_type"]
          destination_url: string | null
          end_date: string | null
          end_time: string | null
          event_date: string
          event_time: string
          event_type: Database["public"]["Enums"]["event_type"]
          google_sheet_id: string | null
          host_id: string
          id: string
          is_paid: boolean
          is_published: boolean
          location: string | null
          metadata: Json
          organizer_name: string | null
          organizer_profile_id: string | null
          parent_event_id: string | null
          recurrence_rule: string | null
          referrals_enabled: boolean
          slug: string
          tags: string[]
          timezone: string
          title: string
          updated_at: string
          view_count: number
          visibility: Database["public"]["Enums"]["event_visibility"]
        }
        Insert: {
          archived_at?: string | null
          banner_url?: string | null
          base_price_cents?: number
          capacity?: number | null
          category?: string | null
          certificates_enabled?: boolean
          checkin_enabled?: boolean
          created_at?: string
          currency?: string
          description?: string | null
          destination_type?: Database["public"]["Enums"]["destination_type"]
          destination_url?: string | null
          end_date?: string | null
          end_time?: string | null
          event_date: string
          event_time: string
          event_type?: Database["public"]["Enums"]["event_type"]
          google_sheet_id?: string | null
          host_id: string
          id?: string
          is_paid?: boolean
          is_published?: boolean
          location?: string | null
          metadata?: Json
          organizer_name?: string | null
          organizer_profile_id?: string | null
          parent_event_id?: string | null
          recurrence_rule?: string | null
          referrals_enabled?: boolean
          slug: string
          tags?: string[]
          timezone?: string
          title: string
          updated_at?: string
          view_count?: number
          visibility?: Database["public"]["Enums"]["event_visibility"]
        }
        Update: {
          archived_at?: string | null
          banner_url?: string | null
          base_price_cents?: number
          capacity?: number | null
          category?: string | null
          certificates_enabled?: boolean
          checkin_enabled?: boolean
          created_at?: string
          currency?: string
          description?: string | null
          destination_type?: Database["public"]["Enums"]["destination_type"]
          destination_url?: string | null
          end_date?: string | null
          end_time?: string | null
          event_date?: string
          event_time?: string
          event_type?: Database["public"]["Enums"]["event_type"]
          google_sheet_id?: string | null
          host_id?: string
          id?: string
          is_paid?: boolean
          is_published?: boolean
          location?: string | null
          metadata?: Json
          organizer_name?: string | null
          organizer_profile_id?: string | null
          parent_event_id?: string | null
          recurrence_rule?: string | null
          referrals_enabled?: boolean
          slug?: string
          tags?: string[]
          timezone?: string
          title?: string
          updated_at?: string
          view_count?: number
          visibility?: Database["public"]["Enums"]["event_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "events_organizer_profile_id_fkey"
            columns: ["organizer_profile_id"]
            isOneToOne: false
            referencedRelation: "organizer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_parent_event_id_fkey"
            columns: ["parent_event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      google_connections: {
        Row: {
          access_token: string | null
          created_at: string
          field_mapping: Json
          google_account_id: string | null
          google_email: string | null
          id: string
          is_active: boolean
          last_sync_error: string | null
          last_synced_at: string | null
          metadata: Json
          refresh_token: string | null
          scopes: string[]
          spreadsheet_id: string | null
          spreadsheet_name: string | null
          spreadsheet_url: string | null
          token_expires_at: string | null
          updated_at: string
          user_id: string
          worksheet_name: string
        }
        Insert: {
          access_token?: string | null
          created_at?: string
          field_mapping?: Json
          google_account_id?: string | null
          google_email?: string | null
          id?: string
          is_active?: boolean
          last_sync_error?: string | null
          last_synced_at?: string | null
          metadata?: Json
          refresh_token?: string | null
          scopes?: string[]
          spreadsheet_id?: string | null
          spreadsheet_name?: string | null
          spreadsheet_url?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
          worksheet_name?: string
        }
        Update: {
          access_token?: string | null
          created_at?: string
          field_mapping?: Json
          google_account_id?: string | null
          google_email?: string | null
          id?: string
          is_active?: boolean
          last_sync_error?: string | null
          last_synced_at?: string | null
          metadata?: Json
          refresh_token?: string | null
          scopes?: string[]
          spreadsheet_id?: string | null
          spreadsheet_name?: string | null
          spreadsheet_url?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string
          worksheet_name?: string
        }
        Relationships: []
      }
      google_oauth_states: {
        Row: {
          created_at: string
          state: string
          user_id: string
        }
        Insert: {
          created_at?: string
          state: string
          user_id: string
        }
        Update: {
          created_at?: string
          state?: string
          user_id?: string
        }
        Relationships: []
      }
      organizer_followers: {
        Row: {
          created_at: string
          id: string
          organizer_profile_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organizer_profile_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organizer_profile_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organizer_followers_organizer_profile_id_fkey"
            columns: ["organizer_profile_id"]
            isOneToOne: false
            referencedRelation: "organizer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizer_profiles: {
        Row: {
          bio: string | null
          brand_primary_color: string | null
          brand_secondary_color: string | null
          city: string | null
          contact_email: string | null
          country: string | null
          created_at: string
          display_name: string
          handle: string
          id: string
          is_published: boolean
          is_verified: boolean
          logo_url: string | null
          metadata: Json
          phone: string | null
          socials: Json
          state: string | null
          updated_at: string
          user_id: string
          website_url: string | null
        }
        Insert: {
          bio?: string | null
          brand_primary_color?: string | null
          brand_secondary_color?: string | null
          city?: string | null
          contact_email?: string | null
          country?: string | null
          created_at?: string
          display_name: string
          handle: string
          id?: string
          is_published?: boolean
          is_verified?: boolean
          logo_url?: string | null
          metadata?: Json
          phone?: string | null
          socials?: Json
          state?: string | null
          updated_at?: string
          user_id: string
          website_url?: string | null
        }
        Update: {
          bio?: string | null
          brand_primary_color?: string | null
          brand_secondary_color?: string | null
          city?: string | null
          contact_email?: string | null
          country?: string | null
          created_at?: string
          display_name?: string
          handle?: string
          id?: string
          is_published?: boolean
          is_verified?: boolean
          logo_url?: string | null
          metadata?: Json
          phone?: string | null
          socials?: Json
          state?: string | null
          updated_at?: string
          user_id?: string
          website_url?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          is_suspended: boolean
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          is_suspended?: boolean
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_suspended?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      registration_forms: {
        Row: {
          closes_at: string | null
          collect_phone: boolean
          created_at: string
          description: string | null
          event_id: string
          id: string
          is_active: boolean
          max_registrations: number | null
          metadata: Json
          name: string
          opens_at: string | null
          success_message: string | null
          updated_at: string
        }
        Insert: {
          closes_at?: string | null
          collect_phone?: boolean
          created_at?: string
          description?: string | null
          event_id: string
          id?: string
          is_active?: boolean
          max_registrations?: number | null
          metadata?: Json
          name?: string
          opens_at?: string | null
          success_message?: string | null
          updated_at?: string
        }
        Update: {
          closes_at?: string | null
          collect_phone?: boolean
          created_at?: string
          description?: string | null
          event_id?: string
          id?: string
          is_active?: boolean
          max_registrations?: number | null
          metadata?: Json
          name?: string
          opens_at?: string | null
          success_message?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "registration_forms_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      registrations: {
        Row: {
          amount_paid_cents: number
          certificate_issued_at: string | null
          checked_in_at: string | null
          created_at: string
          custom_answers: Json
          email: string
          email_error: string | null
          email_sent_at: string | null
          email_status: string
          event_id: string
          form_id: string | null
          full_name: string
          id: string
          metadata: Json
          phone: string | null
          referral_code: string | null
          referred_by: string | null
          status: string
          synced_to_sheet: boolean
          ticket_code: string | null
          ticket_id: string | null
        }
        Insert: {
          amount_paid_cents?: number
          certificate_issued_at?: string | null
          checked_in_at?: string | null
          created_at?: string
          custom_answers?: Json
          email: string
          email_error?: string | null
          email_sent_at?: string | null
          email_status?: string
          event_id: string
          form_id?: string | null
          full_name: string
          id?: string
          metadata?: Json
          phone?: string | null
          referral_code?: string | null
          referred_by?: string | null
          status?: string
          synced_to_sheet?: boolean
          ticket_code?: string | null
          ticket_id?: string | null
        }
        Update: {
          amount_paid_cents?: number
          certificate_issued_at?: string | null
          checked_in_at?: string | null
          created_at?: string
          custom_answers?: Json
          email?: string
          email_error?: string | null
          email_sent_at?: string | null
          email_status?: string
          event_id?: string
          form_id?: string | null
          full_name?: string
          id?: string
          metadata?: Json
          phone?: string | null
          referral_code?: string | null
          referred_by?: string | null
          status?: string
          synced_to_sheet?: boolean
          ticket_code?: string | null
          ticket_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registrations_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "registration_forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registrations_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "registrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registrations_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "event_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      sheet_sync_runs: {
        Row: {
          added_count: number
          connection_id: string
          details: Json
          error: string | null
          failed_count: number
          finished_at: string | null
          id: string
          processed_count: number
          started_at: string
          status: string
          updated_count: number
          user_id: string
        }
        Insert: {
          added_count?: number
          connection_id: string
          details?: Json
          error?: string | null
          failed_count?: number
          finished_at?: string | null
          id?: string
          processed_count?: number
          started_at?: string
          status?: string
          updated_count?: number
          user_id: string
        }
        Update: {
          added_count?: number
          connection_id?: string
          details?: Json
          error?: string | null
          failed_count?: number
          finished_at?: string | null
          id?: string
          processed_count?: number
          started_at?: string
          status?: string
          updated_count?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sheet_sync_runs_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "google_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
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
      is_suspended: { Args: { _user_id: string }; Returns: boolean }
      organizer_follower_count: {
        Args: { _profile_id: string }
        Returns: number
      }
    }
    Enums: {
      app_role: "admin" | "host"
      destination_type:
        | "whatsapp"
        | "telegram"
        | "zoom"
        | "google_meet"
        | "microsoft_teams"
        | "custom"
      event_type: "online" | "physical"
      event_visibility: "public" | "private" | "unlisted"
      field_type:
        | "short_text"
        | "long_text"
        | "dropdown"
        | "radio"
        | "checkbox"
        | "phone"
        | "email"
        | "date"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "host"],
      destination_type: [
        "whatsapp",
        "telegram",
        "zoom",
        "google_meet",
        "microsoft_teams",
        "custom",
      ],
      event_type: ["online", "physical"],
      event_visibility: ["public", "private", "unlisted"],
      field_type: [
        "short_text",
        "long_text",
        "dropdown",
        "radio",
        "checkbox",
        "phone",
        "email",
        "date",
      ],
    },
  },
} as const
