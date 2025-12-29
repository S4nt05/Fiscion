
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      messages: {
        Row: {
          id: string
          sender_id: string | null
          receiver_id: string | null
          content: string
          invoice_ids: string[] | null
          read: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          sender_id?: string | null
          receiver_id?: string | null
          content: string
          invoice_ids?: string[] | null
          read?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          sender_id?: string | null
          receiver_id?: string | null
          content?: string
          invoice_ids?: string[] | null
          read?: boolean | null
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
