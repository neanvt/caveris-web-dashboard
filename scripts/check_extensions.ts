
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load env vars
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  envConfig.split('\n').forEach((line) => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim();
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role for extensions check

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or Key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkExtensions() {
  console.log('Checking extensions...');

  // Try to use crypt function in a select
  const { data, error } = await supabase.rpc('check_pgcrypto');
  
  if (error) {
     console.log('RPC check_pgcrypto failed (expected if not exists). Error:', error.message);
     
     // Alternative: query pg_extension table if allowed
     const { data: ext, error: extErr } = await supabase.from('pg_extension').select('extname').eq('extname', 'pgcrypto');
     if (extErr) {
        console.error('Error checking pg_extension:', extErr.message);
     } else {
        console.log('pgcrypto extension status:', ext?.length > 0 ? 'INSTALLED' : 'NOT FOUND');
     }
  } else {
     console.log('pgcrypto is working!');
  }
}

checkExtensions();
