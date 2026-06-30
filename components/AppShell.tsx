import Sidebar, { type NavKey } from "./Sidebar";
import { isAdminEmail } from "@/lib/is-admin";

export default function AppShell({
  active,
  userEmail,
  children,
}: {
  active: NavKey;
  userEmail?: string | null;
  children: React.ReactNode;
}) {
  // Admin link visibility is decided here, in one place, from the user's email.
  const isAdmin = isAdminEmail(userEmail);
  return (
    <div className="min-h-screen bg-ink text-paper">
      <Sidebar active={active} isAdmin={isAdmin} />
      <div className="pl-[68px]">
        <div className="editorial-vignette">{children}</div>
      </div>
    </div>
  );
}
