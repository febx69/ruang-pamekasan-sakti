import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://your-project-ref.supabase.co'
const supabaseKey = 'your-anon-key'

export const supabase = createClient(supabaseUrl, supabaseKey)

export type Database = {
  public: {
    Tables: {
      bookings: {
        Row: {
          id: string
          date: string
          name: string
          room: string
          start_time: string
          end_time: string
          description: string | null
          created_at: string
          user_id: string
        }
        Insert: {
          id?: string
          date: string
          name: string
          room: string
          start_time: string
          end_time: string
          description?: string | null
          created_at?: string
          user_id: string
        }
        Update: {
          id?: string
          date?: string
          name?: string
          room?: string
          start_time?: string
          end_time?: string
          description?: string | null
          created_at?: string
          user_id?: string
        }
      }
      users: {
        Row: {
          id: string
          username: string
          password: string
          role: 'admin' | 'user'
          created_at: string
        }
        Insert: {
          id?: string
          username: string
          password: string
          role: 'admin' | 'user'
          created_at?: string
        }
        Update: {
          id?: string
          username?: string
          password?: string
          role?: 'admin' | 'user'
          created_at?: string
        }
      }
    }
  }
}