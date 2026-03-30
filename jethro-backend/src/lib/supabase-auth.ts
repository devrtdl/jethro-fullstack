import { createClient } from '@supabase/supabase-js';

import { env } from '../config/env.js';

type EnsurePasswordlessUserInput = {
  email: string;
  fullName?: string;
};

type EnsurePasswordlessUserResult =
  | { status: 'created' | 'existing' }
  | { status: 'unconfigured' };

function hasSupabaseAuthConfig() {
  return Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY);
}

function isDuplicateUserError(message: string) {
  const normalized = message.toLowerCase();
  return normalized.includes('already been registered') || normalized.includes('already registered');
}

export async function ensurePasswordlessUser({
  email,
  fullName,
}: EnsurePasswordlessUserInput): Promise<EnsurePasswordlessUserResult> {
  if (!hasSupabaseAuthConfig()) {
    return { status: 'unconfigured' };
  }

  const supabase = createClient(env.SUPABASE_URL!, env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { error } = await supabase.auth.admin.createUser({
    email,
    // Passwordless access still depends on OTP ownership of the inbox.
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      access_source: 'diagnostic_form',
    },
  });

  if (!error) {
    return { status: 'created' };
  }

  if (isDuplicateUserError(error.message)) {
    return { status: 'existing' };
  }

  throw error;
}
