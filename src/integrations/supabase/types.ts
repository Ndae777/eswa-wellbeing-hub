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
      feedback: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          future_topics: string | null
          id: string
          improvements: string | null
          most_valuable: string | null
          overall_rating: number
          role_at_school: string | null
          school: string | null
          stress_level: number | null
          wellbeing_after: number | null
          wellbeing_before: number | null
          workshop_id: string | null
          would_recommend: boolean | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          future_topics?: string | null
          id?: string
          improvements?: string | null
          most_valuable?: string | null
          overall_rating: number
          role_at_school?: string | null
          school?: string | null
          stress_level?: number | null
          wellbeing_after?: number | null
          wellbeing_before?: number | null
          workshop_id?: string | null
          would_recommend?: boolean | null
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          future_topics?: string | null
          id?: string
          improvements?: string | null
          most_valuable?: string | null
          overall_rating?: number
          role_at_school?: string | null
          school?: string | null
          stress_level?: number | null
          wellbeing_after?: number | null
          wellbeing_before?: number | null
          workshop_id?: string | null
          would_recommend?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
            referencedColumns: ["id"]
          },
        ]
      }
      registrations: {
        Row: {
          attended: boolean
          cancel_token: string
          created_at: string
          dietary_or_access_needs: string | null
          email: string
          full_name: string
          id: string
          phone: string | null
          province: string | null
          role_at_school: string | null
          school: string | null
          workshop_id: string
        }
        Insert: {
          attended?: boolean
          cancel_token?: string
          created_at?: string
          dietary_or_access_needs?: string | null
          email: string
          full_name: string
          id?: string
          phone?: string | null
          province?: string | null
          role_at_school?: string | null
          school?: string | null
          workshop_id: string
        }
        Update: {
          attended?: boolean
          cancel_token?: string
          created_at?: string
          dietary_or_access_needs?: string | null
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          province?: string | null
          role_at_school?: string | null
          school?: string | null
          workshop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "registrations_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_allowlist: {
        Row: {
          created_at: string
          email: string
        }
        Insert: {
          created_at?: string
          email: string
        }
        Update: {
          created_at?: string
          email?: string
        }
        Relationships: []
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
      workshop_joining_details: {
        Row: {
          details: string
          updated_at: string
          workshop_id: string
        }
        Insert: {
          details: string
          updated_at?: string
          workshop_id: string
        }
        Update: {
          details?: string
          updated_at?: string
          workshop_id?: string
        }
        Relationships: []
      }
      workshops: {
        Row: {
          capacity: number
          created_at: string
          description: string
          duration_minutes: number
          facilitator: string | null
          id: string
          is_published: boolean
          location: string
          programme: string
          starts_at: string
          title: string
        }
        Insert: {
          capacity?: number
          created_at?: string
          description?: string
          duration_minutes?: number
          facilitator?: string | null
          id?: string
          is_published?: boolean
          location?: string
          programme?: string
          starts_at: string
          title: string
        }
        Update: {
          capacity?: number
          created_at?: string
          description?: string
          duration_minutes?: number
          facilitator?: string | null
          id?: string
          is_published?: boolean
          location?: string
          programme?: string
          starts_at?: string
          title?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cancel_registration: {
        Args: { p_token: string }
        Returns: string
      }
      get_registration_by_token: {
        Args: { p_token: string }
        Returns: {
          duration_minutes: number
          full_name: string
          is_past: boolean
          joining_details: string | null
          location: string
          starts_at: string
          title: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      workshop_registration_counts: {
        Args: never
        Returns: {
          registration_count: number
          workshop_id: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "staff"
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
      app_role: ["admin", "staff"],
    },
  },
} as const
