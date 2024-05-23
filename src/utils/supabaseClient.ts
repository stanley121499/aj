import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://xazikwjmkxixuxbmpynb.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhhemlrd2pta3hpeHV4Ym1weW5iIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxMzgzNjkyMCwiZXhwIjoyMDI5NDEyOTIwfQ.ykH2Fy6RyFsMV1Odd1WXZWw61q0K25CPvVx8g5I2nIg"

const supabase = createClient(
  supabaseUrl,
  supabaseKey
)

export { supabase }
