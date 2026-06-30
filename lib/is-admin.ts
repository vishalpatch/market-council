/** Single source of truth for the admin check (case-insensitive, trimmed). */
export function isAdminEmail(email?: string | null): boolean {
  const admin = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!admin) return false;
  return !!email && email.trim().toLowerCase() === admin;
}
