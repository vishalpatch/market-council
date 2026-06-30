import Sidebar, { type NavKey } from "./Sidebar";

export default function AppShell({
  active,
  isAdmin = false,
  children,
}: {
  active: NavKey;
  isAdmin?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-ink text-paper">
      <Sidebar active={active} isAdmin={isAdmin} />
      <div className="pl-[68px]">
        <div className="editorial-vignette">{children}</div>
      </div>
    </div>
  );
}
