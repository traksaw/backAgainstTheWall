import { createClient } from "@supabase/supabase-js"

export type Archetype = "avoider" | "gambler" | "realist" | "architect"

export type Database = {
  public: {
    Tables: {
      archetype_pulses: {
        Row: {
          id: string
          archetype: Archetype
          created_at: string
        }
        Insert: {
          id?: string
          archetype: Archetype
          created_at?: string
        }
        Update: {
          id?: string
          archetype?: Archetype
          created_at?: string
        }
        Relationships: []
      }
      context_stats: {
        Row: {
          id: string
          label: string
          value: number
          population: string
          source_name: string
          source_url: string
          archetype_mapping: Archetype | null
          display_order: number
          updated_at: string
        }
        Insert: {
          id?: string
          label: string
          value: number
          population: string
          source_name: string
          source_url: string
          archetype_mapping?: Archetype | null
          display_order: number
          updated_at?: string
        }
        Update: {
          id?: string
          label?: string
          value?: number
          population?: string
          source_name?: string
          source_url?: string
          archetype_mapping?: Archetype | null
          display_order?: number
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      archetype: Archetype
    }
    CompositeTypes: Record<string, never>
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL environment variable is not defined. Please add it to your .env.local file."
  )
}

if (!supabaseAnonKey) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable is not defined. Please add it to your .env.local file."
  )
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
