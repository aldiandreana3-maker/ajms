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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      about_us: {
        Row: {
          content: string
          created_at: string | null
          display_order: number | null
          icon_name: string | null
          id: string
          is_active: boolean | null
          section_key: string
          title: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          display_order?: number | null
          icon_name?: string | null
          id?: string
          is_active?: boolean | null
          section_key: string
          title: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          display_order?: number | null
          icon_name?: string | null
          id?: string
          is_active?: boolean | null
          section_key?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      access_cards: {
        Row: {
          card_number: string
          card_type: string | null
          created_at: string | null
          created_by: string | null
          expires_at: string | null
          id: string
          issued_at: string | null
          ktp_photo_url: string | null
          notes: string | null
          payment_proof_url: string | null
          penghuni_id: string | null
          penghuni_name: string | null
          quantity_requested: number | null
          request_type: string | null
          status: Database["public"]["Enums"]["card_status"] | null
          surat_kuasa_url: string | null
          unit_id: string | null
          unit_number: string | null
          updated_at: string | null
        }
        Insert: {
          card_number: string
          card_type?: string | null
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          issued_at?: string | null
          ktp_photo_url?: string | null
          notes?: string | null
          payment_proof_url?: string | null
          penghuni_id?: string | null
          penghuni_name?: string | null
          quantity_requested?: number | null
          request_type?: string | null
          status?: Database["public"]["Enums"]["card_status"] | null
          surat_kuasa_url?: string | null
          unit_id?: string | null
          unit_number?: string | null
          updated_at?: string | null
        }
        Update: {
          card_number?: string
          card_type?: string | null
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          issued_at?: string | null
          ktp_photo_url?: string | null
          notes?: string | null
          payment_proof_url?: string | null
          penghuni_id?: string | null
          penghuni_name?: string | null
          quantity_requested?: number | null
          request_type?: string | null
          status?: Database["public"]["Enums"]["card_status"] | null
          surat_kuasa_url?: string | null
          unit_id?: string | null
          unit_number?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "access_cards_penghuni_id_fkey"
            columns: ["penghuni_id"]
            isOneToOne: false
            referencedRelation: "penghuni"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_cards_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_password_resets: {
        Row: {
          created_at: string
          id: string
          is_used: boolean | null
          new_password: string
          reset_by: string
          user_email: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_used?: boolean | null
          new_password: string
          reset_by: string
          user_email: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_used?: boolean | null
          new_password?: string
          reset_by?: string
          user_email?: string
          user_id?: string
        }
        Relationships: []
      }
      agent_gallery: {
        Row: {
          agent_id: string
          caption: string | null
          created_at: string | null
          display_order: number | null
          id: string
          image_url: string
          updated_at: string | null
        }
        Insert: {
          agent_id: string
          caption?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_url: string
          updated_at?: string | null
        }
        Update: {
          agent_id?: string
          caption?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_url?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_gallery_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_units: {
        Row: {
          agent_id: string
          created_at: string | null
          id: string
          unit_id: string
        }
        Insert: {
          agent_id: string
          created_at?: string | null
          id?: string
          unit_id: string
        }
        Update: {
          agent_id?: string
          created_at?: string | null
          id?: string
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_units_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_units_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      agents: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          office_location: string | null
          phone: string | null
          photo_url: string | null
          position: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          office_location?: string | null
          phone?: string | null
          photo_url?: string | null
          position: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          office_location?: string | null
          phone?: string | null
          photo_url?: string | null
          position?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      bill_rates: {
        Row: {
          area_label: string
          area_sqm: number
          created_at: string | null
          id: string
          is_active: boolean | null
          monthly_amount: number | null
          quarterly_amount: number
          updated_at: string | null
        }
        Insert: {
          area_label: string
          area_sqm: number
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          monthly_amount?: number | null
          quarterly_amount: number
          updated_at?: string | null
        }
        Update: {
          area_label?: string
          area_sqm?: number
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          monthly_amount?: number | null
          quarterly_amount?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      bills: {
        Row: {
          amount: number
          bill_type: Database["public"]["Enums"]["bill_type"]
          billing_period: string
          created_at: string | null
          due_date: string
          id: string
          is_auto_generated: boolean | null
          notes: string | null
          paid_amount: number | null
          paid_at: string | null
          payment_status: Database["public"]["Enums"]["payment_status"] | null
          penghuni_id: string | null
          unit_id: string | null
          unit_number: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          bill_type: Database["public"]["Enums"]["bill_type"]
          billing_period: string
          created_at?: string | null
          due_date: string
          id?: string
          is_auto_generated?: boolean | null
          notes?: string | null
          paid_amount?: number | null
          paid_at?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          penghuni_id?: string | null
          unit_id?: string | null
          unit_number?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          bill_type?: Database["public"]["Enums"]["bill_type"]
          billing_period?: string
          created_at?: string | null
          due_date?: string
          id?: string
          is_auto_generated?: boolean | null
          notes?: string | null
          paid_amount?: number | null
          paid_at?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          penghuni_id?: string | null
          unit_id?: string | null
          unit_number?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bills_penghuni_id_fkey"
            columns: ["penghuni_id"]
            isOneToOne: false
            referencedRelation: "penghuni"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bills_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      commercial_tenants: {
        Row: {
          business_name: string
          business_type: string | null
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          lease_end: string | null
          lease_start: string | null
          owner_name: string | null
          phone: string | null
          unit_id: string | null
          updated_at: string | null
        }
        Insert: {
          business_name: string
          business_type?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          lease_end?: string | null
          lease_start?: string | null
          owner_name?: string | null
          phone?: string | null
          unit_id?: string | null
          updated_at?: string | null
        }
        Update: {
          business_name?: string
          business_type?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          lease_end?: string | null
          lease_start?: string | null
          owner_name?: string | null
          phone?: string | null
          unit_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commercial_tenants_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      dashboard_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          setting_key: string
          setting_value: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          setting_key: string
          setting_value?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string | null
          description: string
          expense_date: string
          id: string
          receipt_url: string | null
          recorded_by: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          category: string
          created_at?: string | null
          description: string
          expense_date: string
          id?: string
          receipt_url?: string | null
          recorded_by?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string | null
          description?: string
          expense_date?: string
          id?: string
          receipt_url?: string | null
          recorded_by?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      facilities: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          floor_location: string | null
          icon_name: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          floor_location?: string | null
          icon_name?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          floor_location?: string | null
          icon_name?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      foreign_guest_reports: {
        Row: {
          birth_date: string
          birth_place: string
          check_in_date: string
          check_out_date: string
          created_at: string | null
          full_name: string
          gender: string
          id: string
          nationality: string
          passport_expiry: string
          passport_number: string
          passport_photo_url: string | null
          penghuni_name: string | null
          recorded_by: string | null
          unit_id: string | null
          unit_number: string | null
          updated_at: string | null
        }
        Insert: {
          birth_date: string
          birth_place: string
          check_in_date: string
          check_out_date: string
          created_at?: string | null
          full_name: string
          gender: string
          id?: string
          nationality: string
          passport_expiry: string
          passport_number: string
          passport_photo_url?: string | null
          penghuni_name?: string | null
          recorded_by?: string | null
          unit_id?: string | null
          unit_number?: string | null
          updated_at?: string | null
        }
        Update: {
          birth_date?: string
          birth_place?: string
          check_in_date?: string
          check_out_date?: string
          created_at?: string | null
          full_name?: string
          gender?: string
          id?: string
          nationality?: string
          passport_expiry?: string
          passport_number?: string
          passport_photo_url?: string | null
          penghuni_name?: string | null
          recorded_by?: string | null
          unit_id?: string | null
          unit_number?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "foreign_guest_reports_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      goods_movement: {
        Row: {
          carrier_id: string | null
          carrier_name: string | null
          created_at: string | null
          id: string
          item_description: string
          ktp_photo_url: string | null
          movement_type: string
          penghuni_id: string | null
          penghuni_name: string | null
          phone: string | null
          photo_url: string | null
          qr_code: string | null
          quantity: number | null
          recorded_by: string | null
          rental_status: string | null
          unit_id: string | null
          unit_number: string | null
        }
        Insert: {
          carrier_id?: string | null
          carrier_name?: string | null
          created_at?: string | null
          id?: string
          item_description: string
          ktp_photo_url?: string | null
          movement_type: string
          penghuni_id?: string | null
          penghuni_name?: string | null
          phone?: string | null
          photo_url?: string | null
          qr_code?: string | null
          quantity?: number | null
          recorded_by?: string | null
          rental_status?: string | null
          unit_id?: string | null
          unit_number?: string | null
        }
        Update: {
          carrier_id?: string | null
          carrier_name?: string | null
          created_at?: string | null
          id?: string
          item_description?: string
          ktp_photo_url?: string | null
          movement_type?: string
          penghuni_id?: string | null
          penghuni_name?: string | null
          phone?: string | null
          photo_url?: string | null
          qr_code?: string | null
          quantity?: number | null
          recorded_by?: string | null
          rental_status?: string | null
          unit_id?: string | null
          unit_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "goods_movement_penghuni_id_fkey"
            columns: ["penghuni_id"]
            isOneToOne: false
            referencedRelation: "penghuni"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goods_movement_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      keluhan: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string
          handled_by: string | null
          id: string
          penghuni_id: string | null
          penghuni_name: string | null
          phone: string | null
          photo_url: string | null
          response: string | null
          status: Database["public"]["Enums"]["complaint_status"] | null
          subject: string
          unit_id: string | null
          unit_number: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description: string
          handled_by?: string | null
          id?: string
          penghuni_id?: string | null
          penghuni_name?: string | null
          phone?: string | null
          photo_url?: string | null
          response?: string | null
          status?: Database["public"]["Enums"]["complaint_status"] | null
          subject: string
          unit_id?: string | null
          unit_number?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string
          handled_by?: string | null
          id?: string
          penghuni_id?: string | null
          penghuni_name?: string | null
          phone?: string | null
          photo_url?: string | null
          response?: string | null
          status?: Database["public"]["Enums"]["complaint_status"] | null
          subject?: string
          unit_id?: string | null
          unit_number?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "keluhan_penghuni_id_fkey"
            columns: ["penghuni_id"]
            isOneToOne: false
            referencedRelation: "penghuni"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "keluhan_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      news: {
        Row: {
          author_id: string | null
          content: string
          created_at: string | null
          id: string
          image_url: string | null
          published_at: string | null
          scheduled_at: string | null
          status: Database["public"]["Enums"]["news_status"] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          author_id?: string | null
          content: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          published_at?: string | null
          scheduled_at?: string | null
          status?: Database["public"]["Enums"]["news_status"] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string | null
          content?: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          published_at?: string | null
          scheduled_at?: string | null
          status?: Database["public"]["Enums"]["news_status"] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      packages: {
        Row: {
          courier: string
          created_at: string
          id: string
          item_name: string
          item_type: string
          notes: string | null
          owner_name: string
          photo_url: string | null
          picked_up_at: string | null
          picked_up_by: string | null
          picked_up_by_name: string | null
          recorded_by: string | null
          recorded_by_name: string | null
          status: string
          unit_id: string | null
          unit_number: string | null
          updated_at: string
        }
        Insert: {
          courier: string
          created_at?: string
          id?: string
          item_name: string
          item_type: string
          notes?: string | null
          owner_name: string
          photo_url?: string | null
          picked_up_at?: string | null
          picked_up_by?: string | null
          picked_up_by_name?: string | null
          recorded_by?: string | null
          recorded_by_name?: string | null
          status?: string
          unit_id?: string | null
          unit_number?: string | null
          updated_at?: string
        }
        Update: {
          courier?: string
          created_at?: string
          id?: string
          item_name?: string
          item_type?: string
          notes?: string | null
          owner_name?: string
          photo_url?: string | null
          picked_up_at?: string | null
          picked_up_by?: string | null
          picked_up_by_name?: string | null
          recorded_by?: string | null
          recorded_by_name?: string | null
          status?: string
          unit_id?: string | null
          unit_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "packages_picked_up_by_fkey"
            columns: ["picked_up_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "packages_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "packages_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      parking_subscriptions: {
        Row: {
          agent_name: string | null
          created_at: string | null
          created_by: string | null
          end_date: string
          id: string
          is_active: boolean | null
          ktp_photo_url: string | null
          member_card: string | null
          monthly_fee: number | null
          payment_proof_url: string | null
          penghuni_id: string | null
          penghuni_name: string | null
          period_type: string | null
          phone: string | null
          rental_agreement_url: string | null
          rental_status: string | null
          request_type: string | null
          start_date: string
          stnk_photo_url: string | null
          unit_id: string | null
          unit_number: string | null
          updated_at: string | null
          vehicle_brand: string | null
          vehicle_color: string | null
          vehicle_number: string
          vehicle_type: string
          verification_status: string | null
        }
        Insert: {
          agent_name?: string | null
          created_at?: string | null
          created_by?: string | null
          end_date: string
          id?: string
          is_active?: boolean | null
          ktp_photo_url?: string | null
          member_card?: string | null
          monthly_fee?: number | null
          payment_proof_url?: string | null
          penghuni_id?: string | null
          penghuni_name?: string | null
          period_type?: string | null
          phone?: string | null
          rental_agreement_url?: string | null
          rental_status?: string | null
          request_type?: string | null
          start_date: string
          stnk_photo_url?: string | null
          unit_id?: string | null
          unit_number?: string | null
          updated_at?: string | null
          vehicle_brand?: string | null
          vehicle_color?: string | null
          vehicle_number: string
          vehicle_type: string
          verification_status?: string | null
        }
        Update: {
          agent_name?: string | null
          created_at?: string | null
          created_by?: string | null
          end_date?: string
          id?: string
          is_active?: boolean | null
          ktp_photo_url?: string | null
          member_card?: string | null
          monthly_fee?: number | null
          payment_proof_url?: string | null
          penghuni_id?: string | null
          penghuni_name?: string | null
          period_type?: string | null
          phone?: string | null
          rental_agreement_url?: string | null
          rental_status?: string | null
          request_type?: string | null
          start_date?: string
          stnk_photo_url?: string | null
          unit_id?: string | null
          unit_number?: string | null
          updated_at?: string | null
          vehicle_brand?: string | null
          vehicle_color?: string | null
          vehicle_number?: string
          vehicle_type?: string
          verification_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parking_subscriptions_penghuni_id_fkey"
            columns: ["penghuni_id"]
            isOneToOne: false
            referencedRelation: "penghuni"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parking_subscriptions_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      password_reset_requests: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          notes: string | null
          processed_at: string | null
          processed_by: string | null
          requested_at: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          notes?: string | null
          processed_at?: string | null
          processed_by?: string | null
          requested_at?: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          notes?: string | null
          processed_at?: string | null
          processed_by?: string | null
          requested_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      penghuni: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string
          id: string
          is_active: boolean | null
          is_owner: boolean | null
          ktp_number: string | null
          move_in_date: string | null
          move_out_date: string | null
          phone: string | null
          unit_id: string | null
          unit_number: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name: string
          id?: string
          is_active?: boolean | null
          is_owner?: boolean | null
          ktp_number?: string | null
          move_in_date?: string | null
          move_out_date?: string | null
          phone?: string | null
          unit_id?: string | null
          unit_number?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string
          id?: string
          is_active?: boolean | null
          is_owner?: boolean | null
          ktp_number?: string | null
          move_in_date?: string | null
          move_out_date?: string | null
          phone?: string | null
          unit_id?: string | null
          unit_number?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "penghuni_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          is_active: boolean | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          is_active?: boolean | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      units: {
        Row: {
          area_sqm: number | null
          building: string | null
          created_at: string | null
          floor: number | null
          id: string
          status: string | null
          type: string | null
          unit_number: string
          updated_at: string | null
        }
        Insert: {
          area_sqm?: number | null
          building?: string | null
          created_at?: string | null
          floor?: number | null
          id?: string
          status?: string | null
          type?: string | null
          unit_number: string
          updated_at?: string | null
        }
        Update: {
          area_sqm?: number | null
          building?: string | null
          created_at?: string | null
          floor?: number | null
          id?: string
          status?: string | null
          type?: string | null
          unit_number?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      work_orders: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string | null
          description: string | null
          id: string
          keluhan_id: string | null
          priority: string | null
          status: Database["public"]["Enums"]["work_order_status"] | null
          title: string
          unit_id: string | null
          unit_number: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          keluhan_id?: string | null
          priority?: string | null
          status?: Database["public"]["Enums"]["work_order_status"] | null
          title: string
          unit_id?: string | null
          unit_number?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          keluhan_id?: string | null
          priority?: string | null
          status?: Database["public"]["Enums"]["work_order_status"] | null
          title?: string
          unit_id?: string | null
          unit_number?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "work_orders_keluhan_id_fkey"
            columns: ["keluhan_id"]
            isOneToOne: false
            referencedRelation: "keluhan"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      work_permits: {
        Row: {
          approved_by: string | null
          created_at: string | null
          created_by: string | null
          document_url: string | null
          end_date: string
          id: string
          notes: string | null
          penghuni_id: string | null
          penghuni_name: string | null
          phone: string | null
          start_date: string
          status: Database["public"]["Enums"]["permit_status"] | null
          unit_id: string | null
          unit_number: string | null
          updated_at: string | null
          vendor_name: string
          work_description: string
          worker_count: number | null
        }
        Insert: {
          approved_by?: string | null
          created_at?: string | null
          created_by?: string | null
          document_url?: string | null
          end_date: string
          id?: string
          notes?: string | null
          penghuni_id?: string | null
          penghuni_name?: string | null
          phone?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["permit_status"] | null
          unit_id?: string | null
          unit_number?: string | null
          updated_at?: string | null
          vendor_name: string
          work_description: string
          worker_count?: number | null
        }
        Update: {
          approved_by?: string | null
          created_at?: string | null
          created_by?: string | null
          document_url?: string | null
          end_date?: string
          id?: string
          notes?: string | null
          penghuni_id?: string | null
          penghuni_name?: string | null
          phone?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["permit_status"] | null
          unit_id?: string | null
          unit_number?: string | null
          updated_at?: string | null
          vendor_name?: string
          work_description?: string
          worker_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "work_permits_penghuni_id_fkey"
            columns: ["penghuni_id"]
            isOneToOne: false
            referencedRelation: "penghuni"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_permits_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_unit_id: { Args: { _user_id: string }; Returns: string }
      get_user_unit_ids: { Args: { _user_id: string }; Returns: string[] }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_or_above: { Args: { _user_id: string }; Returns: boolean }
      is_staff_or_above: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "admin"
        | "staff"
        | "agent"
        | "penghuni"
        | "staff_tro"
        | "staff_finance"
        | "staff_hrd_ga"
        | "staff_engineering"
        | "staff_outsourcing_cleaning"
        | "staff_outsourcing_security"
        | "staff_outsourcing_parkir"
      bill_type:
        | "ipl"
        | "kebersihan"
        | "keamanan"
        | "sinking_fund"
        | "listrik"
        | "air"
        | "denda"
        | "perbaikan"
      card_status: "active" | "inactive" | "lost" | "damaged"
      complaint_status: "pending" | "proses" | "selesai"
      news_status: "draft" | "published"
      payment_status: "unpaid" | "paid" | "overdue"
      permit_status: "pending" | "approved" | "rejected"
      work_order_status: "pending" | "in_progress" | "completed"
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
      app_role: [
        "super_admin",
        "admin",
        "staff",
        "agent",
        "penghuni",
        "staff_tro",
        "staff_finance",
        "staff_hrd_ga",
        "staff_engineering",
        "staff_outsourcing_cleaning",
        "staff_outsourcing_security",
        "staff_outsourcing_parkir",
      ],
      bill_type: [
        "ipl",
        "kebersihan",
        "keamanan",
        "sinking_fund",
        "listrik",
        "air",
        "denda",
        "perbaikan",
      ],
      card_status: ["active", "inactive", "lost", "damaged"],
      complaint_status: ["pending", "proses", "selesai"],
      news_status: ["draft", "published"],
      payment_status: ["unpaid", "paid", "overdue"],
      permit_status: ["pending", "approved", "rejected"],
      work_order_status: ["pending", "in_progress", "completed"],
    },
  },
} as const
