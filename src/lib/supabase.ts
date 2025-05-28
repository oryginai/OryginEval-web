import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nshojjqkletfofngfflo.supabase.co';
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zaG9qanFrbGV0Zm9mbmdmZmxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4MjcxOTgsImV4cCI6MjA2MzQwMzE5OH0.AzEb12Lq7_3MwrRjqNt0ZCYJllhOHu0kQesgbFw8FTA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    detectSessionInUrl: true,
  },
});
