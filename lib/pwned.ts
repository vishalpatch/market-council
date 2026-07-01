/**
 * Checks a password against the HaveIBeenPwned Passwords API using the
 * k-anonymity model: we send only the first 5 characters of the SHA-1 hash and
 * match the suffix locally — the password (and its full hash) never leave the
 * browser. Fails open (returns false) if the API is unreachable so HIBP
 * downtime can't block legitimate sign-ups.
 */
export async function isPasswordPwned(password: string): Promise<boolean> {
  try {
    const data = new TextEncoder().encode(password);
    const digest = await crypto.subtle.digest("SHA-1", data);
    const hash = Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase();
    const prefix = hash.slice(0, 5);
    const suffix = hash.slice(5);

    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { "Add-Padding": "true" },
    });
    if (!res.ok) return false;

    const text = await res.text();
    return text
      .split("\n")
      .some((line) => line.split(":")[0]?.trim().toUpperCase() === suffix);
  } catch {
    return false;
  }
}
