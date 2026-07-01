import Sidebar, { type NavKey } from "./Sidebar";
import BottomNav from "./BottomNav";
import GlobalSearch from "./search/GlobalSearch";
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
      <BottomNav active={active} />
      <GlobalSearch />
      {/* Sidebar rail on md+, bottom nav on mobile (extra bottom padding for it) */}
      <div className="md:pl-[68px]">
        <div className="editorial-vignette pb-24 md:pb-0">{children}</div>
      </div>
    </div>
  );
}
