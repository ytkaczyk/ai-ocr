export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          user_id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          role: 'user' | 'admin' | 'super_admin'
          tenant_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          user_id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'user' | 'admin' | 'super_admin'
          tenant_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'user' | 'admin' | 'super_admin'
          tenant_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      tenants: {
        Row: {
          id: string
          name: string
          domain: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          domain?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          domain?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      files: {
        Row: {
          id: string
          user_id: string
          tenant_id: string | null
          name: string
          type: 'pdf' | 'markdown'
          size: number
          storage_path: string
          metadata: Record<string, any>
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          tenant_id?: string | null
          name: string
          type: 'pdf' | 'markdown'
          size: number
          storage_path: string
          metadata?: Record<string, any>
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          tenant_id?: string | null
          name?: string
          type?: 'pdf' | 'markdown'
          size?: number
          storage_path?: string
          metadata?: Record<string, any>
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "files_tenant_id_fkey"
            columns: ["tenant_id"]
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "files_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          type: 'info' | 'success' | 'warning' | 'error'
          read: boolean
          metadata: Record<string, any>
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          type?: 'info' | 'success' | 'warning' | 'error'
          read?: boolean
          metadata?: Record<string, any>
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          type?: 'info' | 'success' | 'warning' | 'error'
          read?: boolean
          metadata?: Record<string, any>
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
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