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
      users: {
        Row: {
          id: string
          email: string
          name: string
          phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name: string
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      barbershops: {
        Row: {
          id: string
          user_id: string
          name: string
          phone: string | null
          address_number: string | null
          address: Json
          operating_hours: Json
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          phone?: string | null
          address_number?: string | null
          address: Json
          operating_hours?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          phone?: string | null
          address_number?: string | null
          address?: Json
          operating_hours?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "barbershops_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      services: {
        Row: {
          id: string
          barbershop_id: string
          name: string
          description: string | null
          price: number
          duration_minutes: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          barbershop_id: string
          name: string
          description?: string | null
          price: number
          duration_minutes: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          barbershop_id?: string
          name?: string
          description?: string | null
          price?: number
          duration_minutes?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_barbershop_id_fkey"
            columns: ["barbershop_id"]
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          }
        ]
      }
      clients: {
        Row: {
          id: string
          barbershop_id: string
          name: string
          phone: string | null
          email: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          barbershop_id: string
          name: string
          phone?: string | null
          email?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          barbershop_id?: string
          name?: string
          phone?: string | null
          email?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_barbershop_id_fkey"
            columns: ["barbershop_id"]
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          }
        ]
      }
      appointments: {
        Row: {
          id: string
          barbershop_id: string
          service_id: string
          user_id: string
          client_id: string | null
          client_name: string
          client_phone: string
          appointment_date: string
          status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled'
          payment_status: 'pending' | 'paid' | 'partial' | 'refunded'
          total_amount: number
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          barbershop_id: string
          service_id: string
          user_id: string
          client_id?: string | null
          client_name: string
          client_phone: string
          appointment_date: string
          status?: 'scheduled' | 'confirmed' | 'completed' | 'cancelled'
          payment_status?: 'pending' | 'paid' | 'partial' | 'refunded'
          total_amount: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          barbershop_id?: string
          service_id?: string
          user_id?: string
          client_id?: string | null
          client_name?: string
          client_phone?: string
          appointment_date?: string
          status?: 'scheduled' | 'confirmed' | 'completed' | 'cancelled'
          payment_status?: 'pending' | 'paid' | 'partial' | 'refunded'
          total_amount?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_client_id_fkey"
            columns: ["client_id"]
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_barbershop_id_fkey"
            columns: ["barbershop_id"]
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      financial_records: {
        Row: {
          id: string
          barbershop_id: string
          type: 'income' | 'expense'
          amount: number
          description: string | null
          record_date: string
          created_at: string
        }
        Insert: {
          id?: string
          barbershop_id: string
          type: 'income' | 'expense'
          amount: number
          description?: string | null
          record_date?: string
          created_at?: string
        }
        Update: {
          id?: string
          barbershop_id?: string
          type?: 'income' | 'expense'
          amount?: number
          description?: string | null
          record_date?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_records_barbershop_id_fkey"
            columns: ["barbershop_id"]
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          }
        ]
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
