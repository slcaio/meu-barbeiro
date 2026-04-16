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
          cpf: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          barbershop_id: string
          name: string
          phone?: string | null
          email?: string | null
          cpf?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          barbershop_id?: string
          name?: string
          phone?: string | null
          email?: string | null
          cpf?: string | null
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
      barbers: {
        Row: {
          id: string
          barbershop_id: string
          name: string
          phone: string | null
          email: string | null
          role: string
          avatar_url: string | null
          commission_percentage: number
          is_active: boolean
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          barbershop_id: string
          name: string
          phone?: string | null
          email?: string | null
          role?: string
          avatar_url?: string | null
          commission_percentage?: number
          is_active?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          barbershop_id?: string
          name?: string
          phone?: string | null
          email?: string | null
          role?: string
          avatar_url?: string | null
          commission_percentage?: number
          is_active?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "barbers_barbershop_id_fkey"
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
          barber_id: string | null
          payment_method_id: string | null
          installments: number
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
          barber_id?: string | null
          payment_method_id?: string | null
          installments?: number
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
          barber_id?: string | null
          payment_method_id?: string | null
          installments?: number
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
          },
          {
            foreignKeyName: "appointments_barber_id_fkey"
            columns: ["barber_id"]
            referencedRelation: "barbers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_payment_method_id_fkey"
            columns: ["payment_method_id"]
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          }
        ]
      }
      payment_methods: {
        Row: {
          id: string
          barbershop_id: string
          name: string
          fee_type: 'percentage' | 'fixed'
          fee_value: number
          supports_installments: boolean
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          barbershop_id: string
          name: string
          fee_type?: 'percentage' | 'fixed'
          fee_value?: number
          supports_installments?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          barbershop_id?: string
          name?: string
          fee_type?: 'percentage' | 'fixed'
          fee_value?: number
          supports_installments?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_methods_barbershop_id_fkey"
            columns: ["barbershop_id"]
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          }
        ]
      }
      payment_method_installments: {
        Row: {
          id: string
          payment_method_id: string
          installment_number: number
          fee_percentage: number
          created_at: string
        }
        Insert: {
          id?: string
          payment_method_id: string
          installment_number: number
          fee_percentage?: number
          created_at?: string
        }
        Update: {
          id?: string
          payment_method_id?: string
          installment_number?: number
          fee_percentage?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_method_installments_payment_method_id_fkey"
            columns: ["payment_method_id"]
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          }
        ]
      }
      categories: {
        Row: {
          id: string
          barbershop_id: string
          name: string
          type: 'income' | 'expense'
          created_at: string
        }
        Insert: {
          id?: string
          barbershop_id: string
          name: string
          type: 'income' | 'expense'
          created_at?: string
        }
        Update: {
          id?: string
          barbershop_id?: string
          name?: string
          type?: 'income' | 'expense'
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_barbershop_id_fkey"
            columns: ["barbershop_id"]
            referencedRelation: "barbershops"
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
          category: string
          payment_method_id: string | null
          stock_movement_id: string | null
          record_date: string
          created_at: string
        }
        Insert: {
          id?: string
          barbershop_id: string
          type: 'income' | 'expense'
          amount: number
          description?: string | null
          category?: string
          payment_method_id?: string | null
          stock_movement_id?: string | null
          record_date?: string
          created_at?: string
        }
        Update: {
          id?: string
          barbershop_id?: string
          type?: 'income' | 'expense'
          amount?: number
          description?: string | null
          category?: string
          payment_method_id?: string | null
          stock_movement_id?: string | null
          record_date?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_records_barbershop_id_fkey"
            columns: ["barbershop_id"]
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_records_payment_method_id_fkey"
            columns: ["payment_method_id"]
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_records_stock_movement_id_fkey"
            columns: ["stock_movement_id"]
            referencedRelation: "stock_movements"
            referencedColumns: ["id"]
          }
        ]
      }
      products: {
        Row: {
          id: string
          barbershop_id: string
          name: string
          description: string | null
          cost_price: number
          sale_price: number
          current_stock: number
          min_stock: number
          unit: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          barbershop_id: string
          name: string
          description?: string | null
          cost_price?: number
          sale_price: number
          current_stock?: number
          min_stock?: number
          unit?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          barbershop_id?: string
          name?: string
          description?: string | null
          cost_price?: number
          sale_price?: number
          current_stock?: number
          min_stock?: number
          unit?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_barbershop_id_fkey"
            columns: ["barbershop_id"]
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          }
        ]
      }
      stock_movements: {
        Row: {
          id: string
          product_id: string
          barbershop_id: string
          type: 'entry' | 'exit' | 'adjustment'
          quantity: number
          unit_cost: number | null
          total_cost: number | null
          source: 'manual' | 'sale' | 'purchase' | 'adjustment'
          reference_id: string | null
          financial_status: 'none' | 'pending' | 'settled'
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          barbershop_id: string
          type: 'entry' | 'exit' | 'adjustment'
          quantity: number
          unit_cost?: number | null
          total_cost?: number | null
          source: 'manual' | 'sale' | 'purchase' | 'adjustment'
          reference_id?: string | null
          financial_status?: 'none' | 'pending' | 'settled'
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          barbershop_id?: string
          type?: 'entry' | 'exit' | 'adjustment'
          quantity?: number
          unit_cost?: number | null
          total_cost?: number | null
          source?: 'manual' | 'sale' | 'purchase' | 'adjustment'
          reference_id?: string | null
          financial_status?: 'none' | 'pending' | 'settled'
          notes?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_barbershop_id_fkey"
            columns: ["barbershop_id"]
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_reference_id_fkey"
            columns: ["reference_id"]
            referencedRelation: "financial_records"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_stock: {
        Args: {
          p_product_id: string
          p_quantity: number
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

// Convenience type aliases
export type Service = Database['public']['Tables']['services']['Row']
export type Client = Database['public']['Tables']['clients']['Row']
export type Barber = Database['public']['Tables']['barbers']['Row']
export type PaymentMethod = Database['public']['Tables']['payment_methods']['Row']
export type AppointmentRow = Database['public']['Tables']['appointments']['Row']
export type FinancialRecord = Database['public']['Tables']['financial_records']['Row']
export type Category = Database['public']['Tables']['categories']['Row']
export type Barbershop = Database['public']['Tables']['barbershops']['Row']
export type Product = Database['public']['Tables']['products']['Row']
export type StockMovement = Database['public']['Tables']['stock_movements']['Row']

// Partial types matching common select queries
export type ServiceOption = Pick<Service, 'id' | 'name' | 'price' | 'duration_minutes'>
export type ClientOption = Pick<Client, 'id' | 'name' | 'phone' | 'email'>
export type BarberOption = Pick<Barber, 'id' | 'name' | 'is_active'>
export type PaymentMethodOption = Pick<PaymentMethod, 'id' | 'name' | 'fee_type' | 'fee_value'>
export type PaymentMethodInstallment = Database['public']['Tables']['payment_method_installments']['Row']

// Payment method with installment tiers (used in POS dialog)
export type PaymentMethodWithInstallments = PaymentMethodOption & {
  supports_installments: boolean
  payment_method_installments: Pick<PaymentMethodInstallment, 'installment_number' | 'fee_percentage'>[]
}

// Appointment with joined relations (from select with joins)
export type AppointmentWithRelations = AppointmentRow & {
  services: Pick<Service, 'name' | 'duration_minutes' | 'price'> | null
  barbers: Pick<Barber, 'id' | 'name'> | null
}

// Server action state (used with useActionState)
export type ActionState = { error?: string | null; success?: string } | null
