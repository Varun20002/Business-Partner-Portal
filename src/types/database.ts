// ─── Database Types ────────────────────────────────────────────
// Mirrors the Supabase PostgreSQL schema exactly.

export type UserRole = "partner" | "admin";

export interface Profile {
  id: string;
  uid: string;
  role: UserRole;
  created_at: string;
}

export interface PartnerMetrics {
  id: string;
  partner_uid: string;
  total_users: number;
  traded_users: number;
  eligible_500_users: number;
  volume_eligible_users: number;
   total_volume_inr: number;
  updated_at: string;
}

export interface Webinar {
  id: string;
  title: string;
  poster_url: string;
  external_link: string;
  created_at: string;
}

export interface MarketingMaterial {
  id: string;
  title: string;
  image_url: string;
  share_text_template: string;
  created_at: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  display_order: number;
  created_at?: string;
}

// ─── Supabase Database Type ────────────────────────────────────
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: {
          id: string;
          uid: string;
          role?: UserRole;
          created_at?: string;
        };
        Update: {
          id?: string;
          uid?: string;
          role?: UserRole;
          created_at?: string;
        };
      };
      partner_metrics: {
        Row: PartnerMetrics;
        Insert: {
          id?: string;
          partner_uid: string;
          total_users?: number;
          traded_users?: number;
          eligible_500_users?: number;
          volume_eligible_users?: number;
          total_volume_inr?: number;
          updated_at?: string;
        };
        Update: {
          id?: string;
          partner_uid?: string;
          total_users?: number;
          traded_users?: number;
          eligible_500_users?: number;
          volume_eligible_users?: number;
          total_volume_inr?: number;
          updated_at?: string;
        };
      };
      webinars: {
        Row: Webinar;
        Insert: {
          id?: string;
          title: string;
          poster_url: string;
          external_link: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          poster_url?: string;
          external_link?: string;
          created_at?: string;
        };
      };
      marketing_materials: {
        Row: MarketingMaterial;
        Insert: {
          id?: string;
          title: string;
          image_url: string;
          share_text_template?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          image_url?: string;
          share_text_template?: string;
          created_at?: string;
        };
      };
      faqs: {
        Row: FAQ;
        Insert: {
          id?: string;
          question: string;
          answer: string;
          display_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          question?: string;
          answer?: string;
          display_order?: number;
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
    };
  };
}
