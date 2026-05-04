type Rel = {
  foreignKeyName: string;
  columns: string[];
  isOneToOne?: boolean;
  referencedRelation: string;
  referencedColumns: string[];
};

export type Database = {
  public: {
    Tables: {
      hosts: {
        Row: {
          id: string;
          created_at: string;
          email: string;
          name: string;
          stripe_account_id: string | null;
          onboarding_complete: boolean;
        };
        Insert: {
          id?: string;
          created_at?: string;
          email: string;
          name: string;
          stripe_account_id?: string | null;
          onboarding_complete?: boolean;
        };
        Update: {
          id?: string;
          created_at?: string;
          email?: string;
          name?: string;
          stripe_account_id?: string | null;
          onboarding_complete?: boolean;
        };
        Relationships: Rel[];
      };
      communities: {
        Row: {
          id: string;
          created_at: string;
          host_id: string;
          name: string;
          slug: string;
          type: string;
          description: string | null;
          location: string;
          instagram_handle: string | null;
          contact_email: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          host_id: string;
          name: string;
          slug: string;
          type: string;
          description?: string | null;
          location: string;
          instagram_handle?: string | null;
          contact_email?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          host_id?: string;
          name?: string;
          slug?: string;
          type?: string;
          description?: string | null;
          location?: string;
          instagram_handle?: string | null;
          contact_email?: string | null;
        };
        Relationships: Rel[];
      };
      events: {
        Row: {
          id: string;
          created_at: string;
          community_id: string;
          name: string;
          slug: string;
          description: string | null;
          location: string;
          event_date: string;
          event_time: string;
          price: number;
          currency: string;
          capacity: number;
          is_recurring: boolean;
          recurrence_rule: string | null;
          series_id: string | null;
          status: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          community_id: string;
          name: string;
          slug: string;
          description?: string | null;
          location: string;
          event_date: string;
          event_time: string;
          price?: number;
          currency?: string;
          capacity: number;
          is_recurring?: boolean;
          recurrence_rule?: string | null;
          series_id?: string | null;
          status?: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          community_id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          location?: string;
          event_date?: string;
          event_time?: string;
          price?: number;
          currency?: string;
          capacity?: number;
          is_recurring?: boolean;
          recurrence_rule?: string | null;
          series_id?: string | null;
          status?: string;
        };
        Relationships: Rel[];
      };
      bookings: {
        Row: {
          id: string;
          created_at: string;
          event_id: string;
          member_name: string;
          member_email: string;
          member_whatsapp: string | null;
          status: string;
          payment_status: string;
          stripe_payment_intent_id: string | null;
          amount_paid: number;
          reminder_sent: boolean;
        };
        Insert: {
          id?: string;
          created_at?: string;
          event_id: string;
          member_name: string;
          member_email: string;
          member_whatsapp?: string | null;
          status?: string;
          payment_status?: string;
          stripe_payment_intent_id?: string | null;
          amount_paid?: number;
          reminder_sent?: boolean;
        };
        Update: {
          id?: string;
          created_at?: string;
          event_id?: string;
          member_name?: string;
          member_email?: string;
          member_whatsapp?: string | null;
          status?: string;
          payment_status?: string;
          stripe_payment_intent_id?: string | null;
          amount_paid?: number;
          reminder_sent?: boolean;
        };
        Relationships: Rel[];
      };
      members: {
        Row: {
          id: string;
          created_at: string;
          community_id: string;
          name: string;
          email: string;
          whatsapp: string | null;
          total_bookings: number;
          last_attended: string | null;
          total_spent: number;
          status: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          community_id: string;
          name: string;
          email: string;
          whatsapp?: string | null;
          total_bookings?: number;
          last_attended?: string | null;
          total_spent?: number;
          status?: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          community_id?: string;
          name?: string;
          email?: string;
          whatsapp?: string | null;
          total_bookings?: number;
          last_attended?: string | null;
          total_spent?: number;
          status?: string;
        };
        Relationships: Rel[];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
