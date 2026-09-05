import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://oowrdvlipzebkbkttzyr.supabase.co';
const SUPABASE_PUBLISHABLE_KEY =
  'sb_publishable_8r16mFt_WyEzVfz11JH89w_r6eZdyCZ';

export const configured =
  Boolean(SUPABASE_URL) &&
  Boolean(SUPABASE_PUBLISHABLE_KEY);

export const supabase = configured
  ? createClient(
      SUPABASE_URL,
      SUPABASE_PUBLISHABLE_KEY
    )
  : null;
