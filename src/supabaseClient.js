import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rsyhycnodwvmagmfhbpy.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzeWh5Y25vZHd2bWFnbWZoYnB5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1MzU0MjgsImV4cCI6MjA5NjExMTQyOH0.xKRCHNqqz2Fwxle0aUvfnAuNHHjboETq_ATrnsPIemU'

export const supabase = createClient(supabaseUrl, supabaseKey)