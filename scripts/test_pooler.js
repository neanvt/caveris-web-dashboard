
const { Client } = require('pg');

async function testPooler() {
  const config = {
    host: 'aws-0-ap-south-1.pooler.supabase.com',
    port: 6543,
    user: 'postgres.hiptfgmsyzwlihqssojk',
    password: '0022nEE@tEn**',
    database: 'postgres',
    ssl: {
      rejectUnauthorized: false
    },
    connectionTimeoutMillis: 10000
  };

  console.log(`Testing pooler connection to ${config.host}:${config.port}...`);
  const client = new Client(config);

  try {
    await client.connect();
    console.log(`Successfully connected to Pooler!`);
    const res = await client.query('SELECT current_user, version()');
    console.log('User:', res.rows[0].current_user);
    console.log('Version:', res.rows[0].version);
    await client.end();
  } catch (err) {
    console.error(`Failed to connect: ${err.message}`);
  }
}

testPooler();
