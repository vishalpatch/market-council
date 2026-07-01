import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/**
 * Verifies the session from the request's cookies against Supabase and returns
 * the user, or null. Uses getUser() (not getSession()) so the JWT is validated
 * server-side on every call — identity is never taken from URL or body.
 */
export async function getSessionUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
