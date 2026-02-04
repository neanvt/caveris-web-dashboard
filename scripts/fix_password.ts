
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load env vars manually
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
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or Key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixPassword() {
  console.log('Fixing password for amar.singh@gmail.com...');

  // 1. Get admin hash
  const { data: adminUser, error: adminError } = await supabase
    .from('users')
    .select('password_hash')
    .eq('email', 'admin@caveris.com')
    .single();

  if (adminError || !adminUser) {
    console.error('Error fetching admin hash:', adminError);
    return;
  }

  console.log('Using hash from admin:', adminUser.password_hash);

  // 2. Update Amar's hash
  const { error: updateError } = await supabase
    .from('users')
    .update({ password_hash: adminUser.password_hash })
    .eq('email', 'amar.singh@gmail.com');

  if (updateError) {
    console.error('Error updating Amar:', updateError);
  } else {
    console.log('Successfully updated password hash for amar.singh@gmail.com');
  }
}

fixPassword();
