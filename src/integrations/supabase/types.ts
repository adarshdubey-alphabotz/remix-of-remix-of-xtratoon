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
      ad_impressions: {
        Row: {
          chapter_id: string
          created_at: string
          creator_id: string
          id: string
          manga_id: string
          session_id: string
          user_id: string | null
        }
        Insert: {
          chapter_id: string
          created_at?: string
          creator_id: string
          id?: string
          manga_id: string
          session_id: string
          user_id?: string | null
        }
        Update: {
          chapter_id?: string
          created_at?: string
          creator_id?: string
          id?: string
          manga_id?: string
          session_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_impressions_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_impressions_manga_id_fkey"
            columns: ["manga_id"]
            isOneToOne: false
            referencedRelation: "manga"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string | null
          reference_id: string | null
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string | null
          reference_id?: string | null
          title: string
          type: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string | null
          reference_id?: string | null
          title?: string
          type?: string
        }
        Relationships: []
      }
      announcements: {
        Row: {
          created_at: string
          created_by: string
          ends_at: string | null
          id: string
          is_active: boolean
          link_text: string | null
          link_url: string | null
          message: string
          starts_at: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          ends_at?: string | null
          id?: string
          is_active?: boolean
          link_text?: string | null
          link_url?: string | null
          message: string
          starts_at?: string
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          ends_at?: string | null
          id?: string
          is_active?: boolean
          link_text?: string | null
          link_url?: string | null
          message?: string
          starts_at?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      blogs: {
        Row: {
          author_id: string
          content: string
          created_at: string
          description: string | null
          id: string
          is_faq: boolean
          is_published: boolean
          seo_description: string | null
          seo_keywords: string[] | null
          seo_title: string | null
          slug: string
          thumbnail_url: string | null
          title: string
          updated_at: string
          views: number
        }
        Insert: {
          author_id: string
          content?: string
          created_at?: string
          description?: string | null
          id?: string
          is_faq?: boolean
          is_published?: boolean
          seo_description?: string | null
          seo_keywords?: string[] | null
          seo_title?: string | null
          slug: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          views?: number
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          description?: string | null
          id?: string
          is_faq?: boolean
          is_published?: boolean
          seo_description?: string | null
          seo_keywords?: string[] | null
          seo_title?: string | null
          slug?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          views?: number
        }
        Relationships: []
      }
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
      chapter_unlocks: {
        Row: {
          chapter_id: string
          creator_id: string
          id: string
          manga_id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          chapter_id: string
          creator_id: string
          id?: string
          manga_id: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          chapter_id?: string
          creator_id?: string
          id?: string
          manga_id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chapter_unlocks_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chapter_unlocks_manga_id_fkey"
            columns: ["manga_id"]
            isOneToOne: false
            referencedRelation: "manga"
            referencedColumns: ["id"]
          },
        ]
      }
      chapters: {
        Row: {
          approval_status: string
          chapter_number: number
          created_at: string
          id: string
          is_published: boolean | null
          manga_id: string
          scheduled_at: string | null
          title: string | null
          updated_at: string
          views: number | null
        }
        Insert: {
          approval_status?: string
          chapter_number: number
          created_at?: string
          id?: string
          is_published?: boolean | null
          manga_id: string
          scheduled_at?: string | null
          title?: string | null
          updated_at?: string
          views?: number | null
        }
        Update: {
          approval_status?: string
          chapter_number?: number
          created_at?: string
          id?: string
          is_published?: boolean | null
          manga_id?: string
          scheduled_at?: string | null
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
      comments: {
        Row: {
          chapter_id: string | null
          content: string
          created_at: string
          id: string
          manga_id: string
          parent_id: string | null
          telegram_message_id: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          chapter_id?: string | null
          content: string
          created_at?: string
          id?: string
          manga_id: string
          parent_id?: string | null
          telegram_message_id?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          chapter_id?: string | null
          content?: string
          created_at?: string
          id?: string
          manga_id?: string
          parent_id?: string | null
          telegram_message_id?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_manga_id_fkey"
            columns: ["manga_id"]
            isOneToOne: false
            referencedRelation: "manga"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      community_post_bookmarks: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_post_bookmarks_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_posts: {
        Row: {
          content: string | null
          created_at: string
          creator_id: string
          deleted_at: string | null
          deleted_by: string | null
          id: string
          image_url: string | null
          image_urls: string[] | null
          is_deleted: boolean
          is_pinned: boolean
          likes_count: number
          replies_count: number
          telegram_message_id: number | null
          updated_at: string
          views_count: number
        }
        Insert: {
          content?: string | null
          created_at?: string
          creator_id: string
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          image_url?: string | null
          image_urls?: string[] | null
          is_deleted?: boolean
          is_pinned?: boolean
          likes_count?: number
          replies_count?: number
          telegram_message_id?: number | null
          updated_at?: string
          views_count?: number
        }
        Update: {
          content?: string | null
          created_at?: string
          creator_id?: string
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          image_url?: string | null
          image_urls?: string[] | null
          is_deleted?: boolean
          is_pinned?: boolean
          likes_count?: number
          replies_count?: number
          telegram_message_id?: number | null
          updated_at?: string
          views_count?: number
        }
        Relationships: []
      }
      community_replies: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          telegram_message_id: number | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          telegram_message_id?: number | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          telegram_message_id?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_replies_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_earnings: {
        Row: {
          creator_id: string
          creator_share: number
          estimated_revenue: number
          id: string
          platform_share: number
          total_unlocks: number
          updated_at: string
        }
        Insert: {
          creator_id: string
          creator_share?: number
          estimated_revenue?: number
          id?: string
          platform_share?: number
          total_unlocks?: number
          updated_at?: string
        }
        Update: {
          creator_id?: string
          creator_share?: number
          estimated_revenue?: number
          id?: string
          platform_share?: number
          total_unlocks?: number
          updated_at?: string
        }
        Relationships: []
      }
      follows: {
        Row: {
          created_at: string
          creator_id: string
          follower_id: string
          id: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          follower_id: string
          id?: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          follower_id?: string
          id?: string
        }
        Relationships: []
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
          is_nsfw: boolean
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
          is_nsfw?: boolean
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
          is_nsfw?: boolean
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
      payout_methods: {
        Row: {
          account_details: Json
          created_at: string
          id: string
          is_primary: boolean
          method_type: Database["public"]["Enums"]["payout_method_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          account_details?: Json
          created_at?: string
          id?: string
          is_primary?: boolean
          method_type: Database["public"]["Enums"]["payout_method_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          account_details?: Json
          created_at?: string
          id?: string
          is_primary?: boolean
          method_type?: Database["public"]["Enums"]["payout_method_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payout_requests: {
        Row: {
          account_snapshot: Json
          admin_response_note: string | null
          admin_response_screenshot: string | null
          amount: number
          created_at: string
          creator_display_name: string | null
          creator_username: string | null
          id: string
          method_type: Database["public"]["Enums"]["payout_method_type"]
          net_amount: number
          notes: string | null
          platform_fee_amount: number
          platform_fee_percent: number
          processed_at: string | null
          processed_by: string | null
          status: Database["public"]["Enums"]["payout_status"]
          user_id: string
        }
        Insert: {
          account_snapshot?: Json
          admin_response_note?: string | null
          admin_response_screenshot?: string | null
          amount: number
          created_at?: string
          creator_display_name?: string | null
          creator_username?: string | null
          id?: string
          method_type: Database["public"]["Enums"]["payout_method_type"]
          net_amount?: number
          notes?: string | null
          platform_fee_amount?: number
          platform_fee_percent?: number
          processed_at?: string | null
          processed_by?: string | null
          status?: Database["public"]["Enums"]["payout_status"]
          user_id: string
        }
        Update: {
          account_snapshot?: Json
          admin_response_note?: string | null
          admin_response_screenshot?: string | null
          amount?: number
          created_at?: string
          creator_display_name?: string | null
          creator_username?: string | null
          id?: string
          method_type?: Database["public"]["Enums"]["payout_method_type"]
          net_amount?: number
          notes?: string | null
          platform_fee_amount?: number
          platform_fee_percent?: number
          processed_at?: string | null
          processed_by?: string | null
          status?: Database["public"]["Enums"]["payout_status"]
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          banned_reason: string | null
          bio: string | null
          continent: string | null
          country: string | null
          created_at: string
          currency: string | null
          display_name: string | null
          id: string
          is_banned: boolean
          is_verified: boolean
          profile_theme: string
          role_type: string
          social_links: Json | null
          timezone: string | null
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          banned_reason?: string | null
          bio?: string | null
          continent?: string | null
          country?: string | null
          created_at?: string
          currency?: string | null
          display_name?: string | null
          id?: string
          is_banned?: boolean
          is_verified?: boolean
          profile_theme?: string
          role_type?: string
          social_links?: Json | null
          timezone?: string | null
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          banned_reason?: string | null
          bio?: string | null
          continent?: string | null
          country?: string | null
          created_at?: string
          currency?: string | null
          display_name?: string | null
          id?: string
          is_banned?: boolean
          is_verified?: boolean
          profile_theme?: string
          role_type?: string
          social_links?: Json | null
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
      reports: {
        Row: {
          created_at: string
          details: string | null
          id: string
          manga_id: string
          reason: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: string
          manga_id: string
          reason: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: string
          manga_id?: string
          reason?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_manga_id_fkey"
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
      user_notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string | null
          reference_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string | null
          reference_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string | null
          reference_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
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
      increment_community_post_views: {
        Args: { p_post_id: string }
        Returns: undefined
      }
      increment_manga_views: {
        Args: { p_manga_id: string }
        Returns: undefined
      }
      record_ad_impression: {
        Args: {
          p_chapter_id: string
          p_creator_id: string
          p_manga_id: string
          p_session_id: string
          p_user_id?: string
        }
        Returns: boolean
      }
      record_chapter_unlock: {
        Args: {
          p_chapter_id: string
          p_creator_id: string
          p_manga_id: string
          p_user_id: string
        }
        Returns: boolean
      }
      search_creators: {
        Args: { search_term: string }
        Returns: {
          avatar_url: string | null
          banned_reason: string | null
          bio: string | null
          continent: string | null
          country: string | null
          created_at: string
          currency: string | null
          display_name: string | null
          id: string
          is_banned: boolean
          is_verified: boolean
          profile_theme: string
          role_type: string
          social_links: Json | null
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
      payout_method_type: "paypal" | "binance" | "usdt_ton" | "upi" | "bkash"
      payout_status: "pending" | "processing" | "paid" | "rejected"
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
      payout_method_type: ["paypal", "binance", "usdt_ton", "upi", "bkash"],
      payout_status: ["pending", "processing", "paid", "rejected"],
    },
  },
} as const
