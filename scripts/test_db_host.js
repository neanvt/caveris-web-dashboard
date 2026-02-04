
const { Client } = require('pg');

async function testConnection() {
  const hosts = [
    'db.hiptfgmsyzwlihqssojk.supabase.co',
    'hiptfgmsyzwlihqssojk.supabase.co',
    'aws-0-ap-south-1.pooler.supabase.com'
  ];

  for (const host of hosts) {
    console.log(`Testing host: ${host}`);
    const client = new Client({
      host: host,
      port: 5432,
      user: 'postgres',
      password: '0022nEE@tEn**',
      database: 'postgres',
      ssl: {
        rejectUnauthorized: false
      },
      connectionTimeoutMillis: 5000
    });

    try {
      await client.connect();
      console.log(`Successfully connected to ${host}`);
      await client.end();
      break;
    } catch (err) {
      console.error(`Failed to connect to ${host}: ${err.message}`);
    }
  }
}

testConnection();
