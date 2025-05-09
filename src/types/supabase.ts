export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      packages: {
        Row: {
          id: string;
          created_at: string;
          title: string;
          description: string;
          region: string;
          difficulty: number;
          theme: string;
          gpx_url: string;
          images: string[];
          ranger_id: string;
          is_premium: boolean;
        };
        Insert: {
          id?: string;
          created_at?: string;
          title: string;
          description: string;
          region: string;
          difficulty: number;
          theme: string;
          gpx_url: string;
          images: string[];
          ranger_id: string;
          is_premium?: boolean;
        };
        Update: {
          id?: string;
          created_at?: string;
          title?: string;
          description?: string;
          region?: string;
          difficulty?: number;
          theme?: string;
          gpx_url?: string;
          images?: string[];
          ranger_id?: string;
          is_premium?: boolean;
        };
      };
      profiles: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          user_id: string;
          full_name: string;
          avatar_url: string | null;
          role: 'user' | 'power_user' | 'ranger' | 'admin';
          bio: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          user_id: string;
          full_name: string;
          avatar_url?: string | null;
          role?: 'user' | 'power_user' | 'ranger' | 'admin';
          bio?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          user_id?: string;
          full_name?: string;
          avatar_url?: string | null;
          role?: 'user' | 'power_user' | 'ranger' | 'admin';
          bio?: string | null;
        };
      };
      trips: {
        Row: {
          id: string;
          created_at: string;
          user_id: string;
          title: string;
          start_date: string;
          end_date: string;
          budget: number | null;
          preferences: Json;
          gpx_url: string | null;
          is_ai_generated: boolean;
        };
        Insert: {
          id?: string;
          created_at?: string;
          user_id: string;
          title: string;
          start_date: string;
          end_date: string;
          budget?: number | null;
          preferences?: Json;
          gpx_url?: string | null;
          is_ai_generated?: boolean;
        };
        Update: {
          id?: string;
          created_at?: string;
          user_id?: string;
          title?: string;
          start_date?: string;
          end_date?: string;
          budget?: number | null;
          preferences?: Json;
          gpx_url?: string | null;
          is_ai_generated?: boolean;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          created_at: string;
          user_id: string;
          status: 'active' | 'canceled' | 'past_due';
          plan: 'monthly' | 'yearly';
          current_period_end: string;
          payment_method: 'card' | 'paypal' | 'apple' | 'google';
        };
        Insert: {
          id?: string;
          created_at?: string;
          user_id: string;
          status: 'active' | 'canceled' | 'past_due';
          plan: 'monthly' | 'yearly';
          current_period_end: string;
          payment_method: 'card' | 'paypal' | 'apple' | 'google';
        };
        Update: {
          id?: string;
          created_at?: string;
          user_id?: string;
          status?: 'active' | 'canceled' | 'past_due';
          plan?: 'monthly' | 'yearly';
          current_period_end?: string;
          payment_method?: 'card' | 'paypal' | 'apple' | 'google';
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
};