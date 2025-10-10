// node --env-file=.env.local scripts/set-admin-passwords.mjs
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

// Helper: find a user by email by paging through the list
async function findUserByEmail(email) {
  let page = 1;
  const perPage = 1000;
  for (;;) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const match = data.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
    if (match) return match;
    if (data.users.length < perPage) return null; // no more pages
    page += 1;
  }
}

async function ensureAdmin(email, password) {
  const existing = await findUserByEmail(email);

  if (existing) {
    // Update password
    const { data, error } = await supabase.auth.admin.updateUserById(existing.id, {
      password,
      user_metadata: { role: 'admin' },
    });
    if (error) throw error;
    console.log(`Updated password for ${email}`);
    return data.user;
  }

  // Create user (email confirmed) with password
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
  // <<< EDIT THESE TWO PASSWORDS >>>
  await ensureAdmin('jasmineathea.deleon@gmail.com', 'SetA_Strong_Password1!');
  await ensureAdmin('johnandkristen.deleon@gmail.com', 'SetA_Strong_Password2!');
  console.log('Done.');
}

run().catch((e) => {
  console.error('Failed:', e);
  process.exit(1);
});
