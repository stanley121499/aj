import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://xazikwjmkxixuxbmpynb.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhhemlrd2pta3hpeHV4Ym1weW5iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTM4MzY5MjAsImV4cCI6MjAyOTQxMjkyMH0.eJYZtzF1r_FpR7F_tuA5PnDfxLVfdiGR-3UAoSBbdpI"

const supabase = createClient(
  supabaseUrl,
  supabaseKey
)

export { supabase }
