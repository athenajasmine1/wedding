// node --env-file=.env.local scripts/set-admin-passwords.mjs
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function findUserByEmail(email) {
  let page = 1;
  const perPage = 1000;
  for (;;) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const match = data.users.find(
      (u) => (u.email || '').toLowerCase() === email.toLowerCase()
    );
    if (match) return match;
    if (data.users.length < perPage) return null;
    page += 1;
  }
}

async function ensureAdmin(email, password) {
  if (!email || !password) {
    throw new Error('Missing admin email or password env var');
  }

  const existing = await findUserByEmail(email);

  if (existing) {
    const { data, error } = await supabase.auth.admin.updateUserById(existing.id, {
      password,
      user_metadata: { role: 'admin' },
    });
    if (error) throw error;
    console.log(`Updated password for ${email}`);
    return data.user;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role: 'admin' },
  });
  if (error) throw error;
  console.log(`Created admin user ${email}`);
  return data.user;
}

async function run() {
  await ensureAdmin(process.env.ADMIN_EMAIL_1, process.env.ADMIN_PASSWORD_1);
  await ensureAdmin(process.env.ADMIN_EMAIL_2, process.env.ADMIN_PASSWORD_2);
  console.log('Done.');
}

run().catch((e) => {
  console.error('Failed:', e);
  process.exit(1);
});
