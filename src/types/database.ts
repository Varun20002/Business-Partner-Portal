// ─── Database Types ────────────────────────────────────────────
// Mirrors the Supabase PostgreSQL schema exactly.

export type UserRole = "partner" | "admin";

export interface Profile {
  id: string;
  uid: string;
  role: UserRole;
  created_at: string;
  seen_dashboard?: boolean;
  signed_up_at?: string | null;
}

export interface PartnerMetrics {
  id: string;
  partner_uid: string;
  name?: string;
  rsr_percentage?: number;
  total_users: number;
  traded_users: number;
  eligible_500_users: number;
  volume_eligible_users: number;
  total_volume_inr: number;
  new_users: number;
  crossed_threshold_users: number;
  new_user_incentive_inr: number;
  current_baseline_volume_inr: number;
  incremental_volume_inr: number;
  volume_incentive_inr: number;
  volume_to_next_slab_inr: number;
  next_slab_incentive_inr: number;
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
          seen_dashboard?: boolean;
          signed_up_at?: string | null;
        };
        Update: {
          id?: string;
          uid?: string;
          role?: UserRole;
          created_at?: string;
          seen_dashboard?: boolean;
          signed_up_at?: string | null;
        };
        Relationships: [];
      };
      partner_metrics: {
        Row: PartnerMetrics;
        Insert: {
          id?: string;
          partner_uid: string;
          name?: string;
          rsr_percentage?: number;
          total_users?: number;
          traded_users?: number;
          eligible_500_users?: number;
          volume_eligible_users?: number;
          total_volume_inr?: number;
          new_users?: number;
          crossed_threshold_users?: number;
          new_user_incentive_inr?: number;
          current_baseline_volume_inr?: number;
          incremental_volume_inr?: number;
          volume_incentive_inr?: number;
          volume_to_next_slab_inr?: number;
          next_slab_incentive_inr?: number;
          updated_at?: string;
        };
        Update: {
          id?: string;
          partner_uid?: string;
          name?: string;
          rsr_percentage?: number;
          total_users?: number;
          traded_users?: number;
          eligible_500_users?: number;
          volume_eligible_users?: number;
          total_volume_inr?: number;
          new_users?: number;
          crossed_threshold_users?: number;
          new_user_incentive_inr?: number;
          current_baseline_volume_inr?: number;
          incremental_volume_inr?: number;
          volume_incentive_inr?: number;
          volume_to_next_slab_inr?: number;
          next_slab_incentive_inr?: number;
          updated_at?: string;
        };
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      user_role: UserRole;
    };
  };
}
