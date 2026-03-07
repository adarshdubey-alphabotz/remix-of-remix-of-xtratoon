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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      chapter_pages: {
        Row: {
          chapter_id: string
          created_at: string
          file_size: number | null
          height: number | null
          id: string
          page_number: number
          telegram_file_id: string
          width: number | null
        }
        Insert: {
          chapter_id: string
          created_at?: string
          file_size?: number | null
          height?: number | null
          id?: string
          page_number: number
          telegram_file_id: string
          width?: number | null
        }
        Update: {
          chapter_id?: string
          created_at?: string
          file_size?: number | null
          height?: number | null
          id?: string
          page_number?: number
          telegram_file_id?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "chapter_pages_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
        ]
      }
      chapters: {
        Row: {
          chapter_number: number
          created_at: string
          id: string
          is_published: boolean | null
          manga_id: string
          title: string | null
          updated_at: string
          views: number | null
        }
        Insert: {
          chapter_number: number
          created_at?: string
          id?: string
          is_published?: boolean | null
          manga_id: string
          title?: string | null
          updated_at?: string
          views?: number | null
        }
        Update: {
          chapter_number?: number
          created_at?: string
          id?: string
          is_published?: boolean | null
          manga_id?: string
          title?: string | null
          updated_at?: string
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "chapters_manga_id_fkey"
            columns: ["manga_id"]
            isOneToOne: false
            referencedRelation: "manga"
            referencedColumns: ["id"]
          },
        ]
      }
      manga: {
        Row: {
          approval_status: string
          banner_url: string | null
          bookmarks: number | null
          cover_url: string | null
          created_at: string
          creator_id: string
          description: string | null
          genres: string[] | null
          id: string
          is_featured: boolean | null
          language: string | null
          likes: number | null
          rating_average: number | null
          rating_count: number | null
          slug: string
          status: string
          title: string
          updated_at: string
          views: number | null
        }
        Insert: {
          approval_status?: string
          banner_url?: string | null
          bookmarks?: number | null
          cover_url?: string | null
          created_at?: string
          creator_id: string
          description?: string | null
          genres?: string[] | null
          id?: string
          is_featured?: boolean | null
          language?: string | null
          likes?: number | null
          rating_average?: number | null
          rating_count?: number | null
          slug: string
          status?: string
          title: string
          updated_at?: string
          views?: number | null
        }
        Update: {
          approval_status?: string
          banner_url?: string | null
          bookmarks?: number | null
          cover_url?: string | null
          created_at?: string
          creator_id?: string
          description?: string | null
          genres?: string[] | null
          id?: string
          is_featured?: boolean | null
          language?: string | null
          likes?: number | null
          rating_average?: number | null
          rating_count?: number | null
          slug?: string
          status?: string
          title?: string
          updated_at?: string
          views?: number | null
        }
        Relationships: []
      }
      manga_likes: {
        Row: {
          created_at: string
          id: string
          manga_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          manga_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          manga_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "manga_likes_manga_id_fkey"
            columns: ["manga_id"]
            isOneToOne: false
            referencedRelation: "manga"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          continent: string | null
          country: string | null
          created_at: string
          currency: string | null
          display_name: string | null
          id: string
          role_type: string
          timezone: string | null
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          continent?: string | null
          country?: string | null
          created_at?: string
          currency?: string | null
          display_name?: string | null
          id?: string
          role_type?: string
          timezone?: string | null
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          continent?: string | null
          country?: string | null
          created_at?: string
          currency?: string | null
          display_name?: string | null
          id?: string
          role_type?: string
          timezone?: string | null
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      reading_history: {
        Row: {
          chapter_id: string
          id: string
          manga_id: string
          page_number: number | null
          read_at: string
          user_id: string
        }
        Insert: {
          chapter_id: string
          id?: string
          manga_id: string
          page_number?: number | null
          read_at?: string
          user_id: string
        }
        Update: {
          chapter_id?: string
          id?: string
          manga_id?: string
          page_number?: number | null
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reading_history_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reading_history_manga_id_fkey"
            columns: ["manga_id"]
            isOneToOne: false
            referencedRelation: "manga"
            referencedColumns: ["id"]
          },
        ]
      }
      user_library: {
        Row: {
          created_at: string
          id: string
          manga_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          manga_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          manga_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_library_manga_id_fkey"
            columns: ["manga_id"]
            isOneToOne: false
            referencedRelation: "manga"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      search_creators: {
        Args: { search_term: string }
        Returns: {
          avatar_url: string | null
          bio: string | null
          continent: string | null
          country: string | null
          created_at: string
          currency: string | null
          display_name: string | null
          id: string
          role_type: string
          timezone: string | null
          updated_at: string
          user_id: string
          username: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: false
          isSetofReturn: true
        }
      }
    }
    Enums: {
      app_role: "admin" | "publisher" | "reader"
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
      app_role: ["admin", "publisher", "reader"],
    },
  },
} as const
