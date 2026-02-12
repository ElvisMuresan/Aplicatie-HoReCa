// src/supabaseClient.ts
import { createClient } from '@supabase/supabase-js'

// Luăm valorile din fișierul .env
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string

// ✅ EXPORTĂM constantele pentru a le folosi în alte fișiere
export { SUPABASE_URL, SUPABASE_ANON_KEY }

// Cream clientul Supabase
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)