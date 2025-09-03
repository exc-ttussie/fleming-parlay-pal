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
      legs: {
        Row: {
          american_odds: number
          bookmaker: string
          created_at: string
          decimal_odds: number
          game_desc: string
          game_id: string | null
          id: string
          league: string
          line: number | null
          market_key: string
          notes: string | null
          selection: string
          source: string
          sport_key: string
          status: Database["public"]["Enums"]["leg_status"]
          updated_at: string
          user_id: string
          week_id: string
        }
        Insert: {
          american_odds: number
          bookmaker: string
          created_at?: string
          decimal_odds: number
          game_desc: string
          game_id?: string | null
          id?: string
          league: string
          line?: number | null
          market_key: string
          notes?: string | null
          selection: string
          source: string
          sport_key: string
          status?: Database["public"]["Enums"]["leg_status"]
          updated_at?: string
          user_id: string
          week_id: string
        }
        Update: {
          american_odds?: number
          bookmaker?: string
          created_at?: string
          decimal_odds?: number
          game_desc?: string
          game_id?: string | null
          id?: string
          league?: string
          line?: number | null
          market_key?: string
          notes?: string | null
          selection?: string
          source?: string
          sport_key?: string
          status?: Database["public"]["Enums"]["leg_status"]
          updated_at?: string
          user_id?: string
          week_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "legs_week_id_fkey"
            columns: ["week_id"]
            isOneToOne: false
            referencedRelation: "weeks"
            referencedColumns: ["id"]
          },
        ]
      }
      odds_cache: {
        Row: {
          created_at: string
          external_game_id: string
          game_date: string
          id: string
          league: string
          moneyline_away: number | null
          moneyline_home: number | null
          sport: string
          spread_away: number | null
          spread_away_odds: number | null
          spread_home: number | null
          spread_home_odds: number | null
          team_a: string
          team_b: string
          total_over: number | null
          total_over_odds: number | null
          total_under: number | null
          total_under_odds: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          external_game_id: string
          game_date: string
          id?: string
          league: string
          moneyline_away?: number | null
          moneyline_home?: number | null
          sport: string
          spread_away?: number | null
          spread_away_odds?: number | null
          spread_home?: number | null
          spread_home_odds?: number | null
          team_a: string
          team_b: string
          total_over?: number | null
          total_over_odds?: number | null
          total_under?: number | null
          total_under_odds?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          external_game_id?: string
          game_date?: string
          id?: string
          league?: string
          moneyline_away?: number | null
          moneyline_home?: number | null
          sport?: string
          spread_away?: number | null
          spread_away_odds?: number | null
          spread_home?: number | null
          spread_home_odds?: number | null
          team_a?: string
          team_b?: string
          total_over?: number | null
          total_over_odds?: number | null
          total_under?: number | null
          total_under_odds?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      parlays: {
        Row: {
          combined_american: number
          combined_decimal: number
          created_at: string
          id: string
          legs_count: number
          projected_payout: number
          stake_amount: number
          summary_json: Json
          updated_at: string
          week_id: string
        }
        Insert: {
          combined_american: number
          combined_decimal: number
          created_at?: string
          id?: string
          legs_count: number
          projected_payout: number
          stake_amount: number
          summary_json: Json
          updated_at?: string
          week_id: string
        }
        Update: {
          combined_american?: number
          combined_decimal?: number
          created_at?: string
          id?: string
          legs_count?: number
          projected_payout?: number
          stake_amount?: number
          summary_json?: Json
          updated_at?: string
          week_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "parlays_week_id_fkey"
            columns: ["week_id"]
            isOneToOne: true
            referencedRelation: "weeks"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          role: Database["public"]["Enums"]["app_role"]
          team_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name: string
          role?: Database["public"]["Enums"]["app_role"]
          team_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          role?: Database["public"]["Enums"]["app_role"]
          team_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      seasons: {
        Row: {
          created_at: string
          end_date: string
          id: string
          label: string
          league: string
          start_date: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          label: string
          league: string
          start_date: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          label?: string
          league?: string
          start_date?: string
        }
        Relationships: []
      }
      weeks: {
        Row: {
          created_at: string
          finalized_at: string | null
          id: string
          locks_at: string
          opens_at: string
          season_id: string
          stake_amount: number
          status: Database["public"]["Enums"]["week_status"]
          updated_at: string
          week_number: number
        }
        Insert: {
          created_at?: string
          finalized_at?: string | null
          id?: string
          locks_at: string
          opens_at: string
          season_id: string
          stake_amount?: number
          status?: Database["public"]["Enums"]["week_status"]
          updated_at?: string
          week_number: number
        }
        Update: {
          created_at?: string
          finalized_at?: string | null
          id?: string
          locks_at?: string
          opens_at?: string
          season_id?: string
          stake_amount?: number
          status?: Database["public"]["Enums"]["week_status"]
          updated_at?: string
          week_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "weeks_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      safe_profiles: {
        Row: {
          name: string | null
          team_name: string | null
          user_id: string | null
        }
        Insert: {
          name?: string | null
          team_name?: string | null
          user_id?: string | null
        }
        Update: {
          name?: string | null
          team_name?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      is_commissioner: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      app_role: "MEMBER" | "COMMISSIONER"
      leg_status: "PENDING" | "OK" | "DUPLICATE" | "CONFLICT" | "REJECTED"
      week_status: "OPEN" | "LOCKED" | "FINALIZED"
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
      app_role: ["MEMBER", "COMMISSIONER"],
      leg_status: ["PENDING", "OK", "DUPLICATE", "CONFLICT", "REJECTED"],
      week_status: ["OPEN", "LOCKED", "FINALIZED"],
    },
  },
} as const
