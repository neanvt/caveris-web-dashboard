
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load env vars manually since we are running a standalone script
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

async function checkUsers() {
  console.log('Checking users...');

  const { data: adminUser, error: adminError } = await supabase
    .from('users')
    .select('*')
    .eq('email', 'admin@caveris.com')
    .single();

  if (adminError) {
    console.error('Error fetching admin:', adminError);
  } else {
    console.log('Admin User Found:', {
      email: adminUser.email,
      id: adminUser.id,
      role: adminUser.role,
      password_hash: adminUser.password_hash,
      is_active: adminUser.is_active
    });
  }

  const { data: amarUser, error: amarError } = await supabase
    .from('users')
    .select('*')
    .eq('email', 'amar.singh@gmail.com')
    .single();

  if (amarError) {
    console.error('Error fetching Amar:', amarError);
  } else {
    console.log('Amar User Found:', {
      email: amarUser.email,
      id: amarUser.id,
      role: amarUser.role,
      password_hash: amarUser.password_hash,
      is_active: amarUser.is_active
    });
  }
}

checkUsers();
