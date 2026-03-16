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
      bill_payments: {
        Row: {
          bill_id: string
          created_at: string | null
          id: string
          is_paid: boolean
          month_date: string
          month_label: string
          month_number: number
          paid_amount: number | null
          paid_at: string | null
          sc_amount: number
          sf_amount: number
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          bill_id: string
          created_at?: string | null
          id?: string
          is_paid?: boolean
          month_date: string
          month_label: string
          month_number: number
          paid_amount?: number | null
          paid_at?: string | null
          sc_amount?: number
          sf_amount?: number
          total_amount?: number
          updated_at?: string | null
        }
        Update: {
          bill_id?: string
          created_at?: string | null
          id?: string
          is_paid?: boolean
          month_date?: string
          month_label?: string
          month_number?: number
          paid_amount?: number | null
          paid_at?: string | null
          sc_amount?: number
          sf_amount?: number
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bill_payments_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
        ]
      }
      bill_rates: {
        Row: {
          area_label: string
          area_sqm: number
          created_at: string | null
          id: string
          is_active: boolean | null
          monthly_amount: number | null
          monthly_sc: number | null
          monthly_sf: number | null
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
          monthly_sc?: number | null
          monthly_sf?: number | null
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
          monthly_sc?: number | null
          monthly_sf?: number | null
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
          quarter_end: string | null
          quarter_label: string | null
          quarter_start: string | null
          sc_monthly: number | null
          sc_total: number | null
          sf_monthly: number | null
          sf_total: number | null
          total_amount: number | null
          unit_id: string | null
          unit_number: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          bill_type?: Database["public"]["Enums"]["bill_type"]
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
          quarter_end?: string | null
          quarter_label?: string | null
          quarter_start?: string | null
          sc_monthly?: number | null
          sc_total?: number | null
          sf_monthly?: number | null
          sf_total?: number | null
          total_amount?: number | null
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
          quarter_end?: string | null
          quarter_label?: string | null
          quarter_start?: string | null
          sc_monthly?: number | null
          sc_total?: number | null
          sf_monthly?: number | null
          sf_total?: number | null
          total_amount?: number | null
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
      cashier_queues: {
        Row: {
          called_at: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          id: string
          queue_date: string
          queue_number: string
          status: string
          updated_at: string
        }
        Insert: {
          called_at?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          queue_date?: string
          queue_number: string
          status?: string
          updated_at?: string
        }
        Update: {
          called_at?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          queue_date?: string
          queue_number?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      cashier_transaction_items: {
        Row: {
          created_at: string
          id: string
          item_name: string
          price: number
          quantity: number
          total: number
          transaction_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          item_name: string
          price?: number
          quantity?: number
          total?: number
          transaction_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          item_name?: string
          price?: number
          quantity?: number
          total?: number
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cashier_transaction_items_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "cashier_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      cashier_transactions: {
        Row: {
          cashier_id: string | null
          created_at: string
          customer_name: string
          id: string
          payment_method: string
          queue_id: string | null
          queue_number: string
          subtotal: number
          total_amount: number
          transaction_date: string
          transaction_id: string
          updated_at: string
        }
        Insert: {
          cashier_id?: string | null
          created_at?: string
          customer_name: string
          id?: string
          payment_method?: string
          queue_id?: string | null
          queue_number: string
          subtotal?: number
          total_amount?: number
          transaction_date?: string
          transaction_id: string
          updated_at?: string
        }
        Update: {
          cashier_id?: string | null
          created_at?: string
          customer_name?: string
          id?: string
          payment_method?: string
          queue_id?: string | null
          queue_number?: string
          subtotal?: number
          total_amount?: number
          transaction_date?: string
          transaction_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cashier_transactions_queue_id_fkey"
            columns: ["queue_id"]
            isOneToOne: false
            referencedRelation: "cashier_queues"
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
      electric_meters: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          install_date: string | null
          kwh_balance: number
          meter_number: string
          meter_status: string
          meter_type: string
          penghuni_name: string | null
          price_per_kwh: number
          unit_id: string | null
          unit_number: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          install_date?: string | null
          kwh_balance?: number
          meter_number: string
          meter_status?: string
          meter_type?: string
          penghuni_name?: string | null
          price_per_kwh?: number
          unit_id?: string | null
          unit_number: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          install_date?: string | null
          kwh_balance?: number
          meter_number?: string
          meter_status?: string
          meter_type?: string
          penghuni_name?: string | null
          price_per_kwh?: number
          unit_id?: string | null
          unit_number?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "electric_meters_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      electric_transactions: {
        Row: {
          balance_after: number
          balance_before: number
          created_at: string
          id: string
          kwh_amount: number
          meter_id: string | null
          meter_number: string
          nominal: number
          notes: string | null
          operator_id: string | null
          operator_name: string | null
          penghuni_name: string | null
          price_per_kwh: number
          transaction_date: string
          unit_id: string | null
          unit_number: string
          updated_at: string
        }
        Insert: {
          balance_after?: number
          balance_before?: number
          created_at?: string
          id?: string
          kwh_amount: number
          meter_id?: string | null
          meter_number: string
          nominal: number
          notes?: string | null
          operator_id?: string | null
          operator_name?: string | null
          penghuni_name?: string | null
          price_per_kwh: number
          transaction_date?: string
          unit_id?: string | null
          unit_number: string
          updated_at?: string
        }
        Update: {
          balance_after?: number
          balance_before?: number
          created_at?: string
          id?: string
          kwh_amount?: number
          meter_id?: string | null
          meter_number?: string
          nominal?: number
          notes?: string | null
          operator_id?: string | null
          operator_name?: string | null
          penghuni_name?: string | null
          price_per_kwh?: number
          transaction_date?: string
          unit_id?: string | null
          unit_number?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "electric_transactions_meter_id_fkey"
            columns: ["meter_id"]
            isOneToOne: false
            referencedRelation: "electric_meters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "electric_transactions_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_attendance: {
        Row: {
          attendance_date: string
          check_in_photo_url: string | null
          check_in_time: string | null
          check_out_photo_url: string | null
          check_out_time: string | null
          created_at: string
          id: string
          notes: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          attendance_date?: string
          check_in_photo_url?: string | null
          check_in_time?: string | null
          check_out_photo_url?: string | null
          check_out_time?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          attendance_date?: string
          check_in_photo_url?: string | null
          check_in_time?: string | null
          check_out_photo_url?: string | null
          check_out_time?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      employee_biodata: {
        Row: {
          address: string | null
          avatar_url: string | null
          bank_account_number: string | null
          bank_name: string | null
          birth_date: string | null
          birth_place: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          birth_date?: string | null
          birth_place?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          birth_date?: string | null
          birth_place?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      employee_leaves: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          end_date: string
          id: string
          leave_type: string
          notes: string | null
          reason: string | null
          start_date: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          end_date: string
          id?: string
          leave_type?: string
          notes?: string | null
          reason?: string | null
          start_date: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          end_date?: string
          id?: string
          leave_type?: string
          notes?: string | null
          reason?: string | null
          start_date?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      employee_overtimes: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          end_time: string
          hours: number | null
          id: string
          notes: string | null
          overtime_date: string
          reason: string | null
          start_time: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          end_time: string
          hours?: number | null
          id?: string
          notes?: string | null
          overtime_date: string
          reason?: string | null
          start_time: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          end_time?: string
          hours?: number | null
          id?: string
          notes?: string | null
          overtime_date?: string
          reason?: string | null
          start_time?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      employee_payroll: {
        Row: {
          allowance: number
          base_salary: number
          created_at: string
          created_by: string | null
          deductions: number
          employee_name: string
          id: string
          notes: string | null
          period_month: number
          period_year: number
          total_attendance: number
          total_leaves: number
          total_overtimes: number
          total_permits: number
          total_salary: number
          updated_at: string
          user_id: string
        }
        Insert: {
          allowance?: number
          base_salary?: number
          created_at?: string
          created_by?: string | null
          deductions?: number
          employee_name: string
          id?: string
          notes?: string | null
          period_month: number
          period_year: number
          total_attendance?: number
          total_leaves?: number
          total_overtimes?: number
          total_permits?: number
          total_salary?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          allowance?: number
          base_salary?: number
          created_at?: string
          created_by?: string | null
          deductions?: number
          employee_name?: string
          id?: string
          notes?: string | null
          period_month?: number
          period_year?: number
          total_attendance?: number
          total_leaves?: number
          total_overtimes?: number
          total_permits?: number
          total_salary?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      employee_permits: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          document_url: string | null
          id: string
          notes: string | null
          permit_date: string
          permit_type: string
          reason: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          document_url?: string | null
          id?: string
          notes?: string | null
          permit_date: string
          permit_type?: string
          reason: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          document_url?: string | null
          id?: string
          notes?: string | null
          permit_date?: string
          permit_type?: string
          reason?: string
          status?: string
          updated_at?: string
          user_id?: string
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
      field_inspections: {
        Row: {
          completed_by: string | null
          completed_by_name: string | null
          created_at: string
          created_by: string | null
          created_by_name: string | null
          finding_description: string
          id: string
          photo_after_url: string | null
          photo_before_url: string | null
          unit_id: string | null
          unit_number: string
          updated_at: string
          work_status: string
        }
        Insert: {
          completed_by?: string | null
          completed_by_name?: string | null
          created_at?: string
          created_by?: string | null
          created_by_name?: string | null
          finding_description: string
          id?: string
          photo_after_url?: string | null
          photo_before_url?: string | null
          unit_id?: string | null
          unit_number: string
          updated_at?: string
          work_status?: string
        }
        Update: {
          completed_by?: string | null
          completed_by_name?: string | null
          created_at?: string
          created_by?: string | null
          created_by_name?: string | null
          finding_description?: string
          id?: string
          photo_after_url?: string | null
          photo_before_url?: string | null
          unit_id?: string | null
          unit_number?: string
          updated_at?: string
          work_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "field_inspections_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
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
      housekeeping_tasks: {
        Row: {
          area_name: string
          assigned_to: string | null
          completed_at: string | null
          completed_by: string | null
          completed_by_name: string | null
          created_at: string
          created_by: string | null
          created_by_name: string | null
          id: string
          notes: string | null
          photo_url: string | null
          status: string
          task_date: string
          task_description: string
          updated_at: string
        }
        Insert: {
          area_name: string
          assigned_to?: string | null
          completed_at?: string | null
          completed_by?: string | null
          completed_by_name?: string | null
          created_at?: string
          created_by?: string | null
          created_by_name?: string | null
          id?: string
          notes?: string | null
          photo_url?: string | null
          status?: string
          task_date?: string
          task_description: string
          updated_at?: string
        }
        Update: {
          area_name?: string
          assigned_to?: string | null
          completed_at?: string | null
          completed_by?: string | null
          completed_by_name?: string | null
          created_at?: string
          created_by?: string | null
          created_by_name?: string | null
          id?: string
          notes?: string | null
          photo_url?: string | null
          status?: string
          task_date?: string
          task_description?: string
          updated_at?: string
        }
        Relationships: []
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
          address: string | null
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
          address?: string | null
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
          address?: string | null
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
      security_patrols: {
        Row: {
          created_at: string
          id: string
          location: string
          notes: string | null
          officer_id: string | null
          officer_name: string | null
          patrol_date: string
          patrol_time: string
          photo_url: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          location: string
          notes?: string | null
          officer_id?: string | null
          officer_name?: string | null
          patrol_date?: string
          patrol_time?: string
          photo_url?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          location?: string
          notes?: string | null
          officer_id?: string | null
          officer_name?: string | null
          patrol_date?: string
          patrol_time?: string
          photo_url?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      system_activation: {
        Row: {
          activated_at: string | null
          created_at: string
          deactivated_at: string | null
          id: string
          system_status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          activated_at?: string | null
          created_at?: string
          deactivated_at?: string | null
          id?: string
          system_status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          activated_at?: string | null
          created_at?: string
          deactivated_at?: string | null
          id?: string
          system_status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      system_notifications: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_read_by: Json
          message: string
          target_roles: string[]
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_read_by?: Json
          message: string
          target_roles?: string[]
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_read_by?: Json
          message?: string
          target_roles?: string[]
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      system_payments: {
        Row: {
          created_at: string
          due_date: string | null
          id: string
          jenis_pembayaran: string
          nominal: number
          notes: string | null
          recorded_by: string | null
          status: string
          tanggal_bayar: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          due_date?: string | null
          id?: string
          jenis_pembayaran: string
          nominal: number
          notes?: string | null
          recorded_by?: string | null
          status?: string
          tanggal_bayar?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          due_date?: string | null
          id?: string
          jenis_pembayaran?: string
          nominal?: number
          notes?: string | null
          recorded_by?: string | null
          status?: string
          tanggal_bayar?: string
          updated_at?: string
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
      water_meters: {
        Row: {
          billing_month: string
          created_at: string
          id: string
          meter_end: number
          meter_start: number
          nominal: number | null
          penghuni_name: string | null
          photo_end_url: string | null
          photo_start_url: string | null
          photo_url: string | null
          recorded_by: string | null
          recorded_by_name: string | null
          unit_id: string | null
          unit_number: string
          updated_at: string
          usage_m3: number | null
        }
        Insert: {
          billing_month?: string
          created_at?: string
          id?: string
          meter_end?: number
          meter_start?: number
          nominal?: number | null
          penghuni_name?: string | null
          photo_end_url?: string | null
          photo_start_url?: string | null
          photo_url?: string | null
          recorded_by?: string | null
          recorded_by_name?: string | null
          unit_id?: string | null
          unit_number: string
          updated_at?: string
          usage_m3?: number | null
        }
        Update: {
          billing_month?: string
          created_at?: string
          id?: string
          meter_end?: number
          meter_start?: number
          nominal?: number | null
          penghuni_name?: string | null
          photo_end_url?: string | null
          photo_start_url?: string | null
          photo_url?: string | null
          recorded_by?: string | null
          recorded_by_name?: string | null
          unit_id?: string | null
          unit_number?: string
          updated_at?: string
          usage_m3?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "water_meters_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
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
      payment_status: "unpaid" | "paid" | "overdue" | "partial"
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
      payment_status: ["unpaid", "paid", "overdue", "partial"],
      permit_status: ["pending", "approved", "rejected"],
      work_order_status: ["pending", "in_progress", "completed"],
    },
  },
} as const
