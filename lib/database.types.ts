
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
      countries: {
        Row: {
          code: string
          name: string
          currency: string
          language: string
          fiscal_year_start: string | null
          fiscal_year_end: string | null
          config: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          code: string
          name: string
          currency: string
          language?: string
          fiscal_year_start?: string | null
          fiscal_year_end?: string | null
          config?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          code?: string
          name?: string
          currency?: string
          language?: string
          fiscal_year_start?: string | null
          fiscal_year_end?: string | null
          config?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          user_type: string
          country_code: string | null
          business_type: string | null
          invoices_this_month: number
          invoice_limit: number
          subscription_plan: string
          accountant_bio: string | null
          accountant_specialization: string[] | null
          accountant_rating: number
          accountant_clients_count: number
          accountant_max_clients: number
          assigned_accountant_id: string | null
          paddle_customer_id: string | null
          created_at: string
          updated_at: string
          name: string | null
          emailVerified: string | null
          image: string | null
        }
        Insert: {
          id?: string
          email: string
          full_name?: string | null
          user_type?: string
          country_code?: string | null
          business_type?: string | null
          invoices_this_month?: number
          invoice_limit?: number
          subscription_plan?: string
          accountant_bio?: string | null
          accountant_specialization?: string[] | null
          accountant_rating?: number
          accountant_clients_count?: number
          accountant_max_clients?: number
          assigned_accountant_id?: string | null
          paddle_customer_id?: string | null
          created_at?: string
          updated_at?: string
          name?: string | null
          emailVerified?: string | null
          image?: string | null
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          user_type?: string
          country_code?: string | null
          business_type?: string | null
          invoices_this_month?: number
          invoice_limit?: number
          subscription_plan?: string
          accountant_bio?: string | null
          accountant_specialization?: string[] | null
          accountant_rating?: number
          accountant_clients_count?: number
          accountant_max_clients?: number
          assigned_accountant_id?: string | null
          paddle_customer_id?: string | null
          created_at?: string
          updated_at?: string
          name?: string | null
          emailVerified?: string | null
          image?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string | null
          paddle_subscription_id: string | null
          paddle_price_id: string | null
          paddle_transaction_id: string | null
          plan_type: string | null
          status: string
          current_period_start: string | null
          current_period_end: string | null
          cancel_at_period_end: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          paddle_subscription_id?: string | null
          paddle_price_id?: string | null
          paddle_transaction_id?: string | null
          plan_type?: string | null
          status?: string
          current_period_start?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          paddle_subscription_id?: string | null
          paddle_price_id?: string | null
          paddle_transaction_id?: string | null
          plan_type?: string | null
          status?: string
          current_period_start?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean
          created_at?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          id: string
          user_id: string
          file_name: string
          file_url: string
          file_size: number | null
          file_type: string | null
          invoice_number: string | null
          vendor_name: string | null
          vendor_tax_id: string | null
          invoice_date: string | null
          due_date: string | null
          total_amount: number
          tax_amount: number
          subtotal_amount: number | null
          currency: string
          category: string | null
          is_deductible: boolean
          notes: string | null
          raw_text: string | null
          ocr_data: Json
          ocr_confidence: number | null
          status: string
          reviewed_by_accountant_id: string | null
          reviewed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          file_name: string
          file_url: string
          file_size?: number | null
          file_type?: string | null
          invoice_number?: string | null
          vendor_name?: string | null
          vendor_tax_id?: string | null
          invoice_date?: string | null
          due_date?: string | null
          total_amount: number
          tax_amount?: number
          subtotal_amount?: number | null
          currency?: string
          category?: string | null
          is_deductible?: boolean
          notes?: string | null
          raw_text?: string | null
          ocr_data?: Json
          ocr_confidence?: number | null
          status?: string
          reviewed_by_accountant_id?: string | null
          reviewed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          file_name?: string
          file_url?: string
          file_size?: number | null
          file_type?: string | null
          invoice_number?: string | null
          vendor_name?: string | null
          vendor_tax_id?: string | null
          invoice_date?: string | null
          due_date?: string | null
          total_amount?: number
          tax_amount?: number
          subtotal_amount?: number | null
          currency?: string
          category?: string | null
          is_deductible?: boolean
          notes?: string | null
          raw_text?: string | null
          ocr_data?: Json
          ocr_confidence?: number | null
          status?: string
          reviewed_by_accountant_id?: string | null
          reviewed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      accountant_templates: {
        Row: {
          id: string
          accountant_id: string | null
          template_name: string
          template_type: string
          template_content: Json
          is_default: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          accountant_id?: string | null
          template_name: string
          template_type?: string
          template_content: Json
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          accountant_id?: string | null
          template_name?: string
          template_type?: string
          template_content?: Json
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          id: string
          sender_id: string | null
          receiver_id: string | null
          content: string
          invoice_ids: string[]
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          sender_id?: string | null
          receiver_id?: string | null
          content: string
          invoice_ids?: string[]
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          sender_id?: string | null
          receiver_id?: string | null
          content?: string
          invoice_ids?: string[]
          read?: boolean
          created_at?: string
        }
        Relationships: []
      }
      system_config: {
        Row: {
          id: string
          config_key: string
          config_value: Json
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          config_key: string
          config_value: Json
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          config_key?: string
          config_value?: Json
          description?: string | null
          created_at?: string
        }
        Relationships: []
      }
      accounts: {
        Row: {
          id: string
          userId: string
          type: string
          provider: string
          providerAccountId: string
          refresh_token: string | null
          access_token: string | null
          expires_at: number | null
          token_type: string | null
          scope: string | null
          id_token: string | null
          session_state: string | null
        }
        Insert: {
          id?: string
          userId: string
          type: string
          provider: string
          providerAccountId: string
          refresh_token?: string | null
          access_token?: string | null
          expires_at?: number | null
          token_type?: string | null
          scope?: string | null
          id_token?: string | null
          session_state?: string | null
        }
        Update: {
          id?: string
          userId?: string
          type?: string
          provider?: string
          providerAccountId?: string
          refresh_token?: string | null
          access_token?: string | null
          expires_at?: number | null
          token_type?: string | null
          scope?: string | null
          id_token?: string | null
          session_state?: string | null
        }
        Relationships: []
      }
      sessions: {
        Row: {
          id: string
          sessionToken: string
          userId: string
          expires: string
        }
        Insert: {
          id?: string
          sessionToken: string
          userId: string
          expires: string
        }
        Update: {
          id?: string
          sessionToken?: string
          userId?: string
          expires?: string
        }
        Relationships: []
      }
      verification_tokens: {
        Row: {
          identifier: string
          token: string
          expires: string
        }
        Insert: {
          identifier: string
          token: string
          expires: string
        }
        Update: {
          identifier?: string
          token?: string
          expires?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_user_invoice_count: {
        Args: {
          user_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
