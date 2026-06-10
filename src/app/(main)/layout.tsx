/**
 * Layout wrapper for the main authenticated section.
 * All tabs share the root layout's structure; this adds the nav bars
 * and any shared state or guards needed across the 5 main tabs.
 */
import { TopNav, MobileTopBar } from "@/components/layout/TopNav";
import { BottomNav } from "@/components/layout/BottomNav";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Desktop top nav */}
      <TopNav />
      {/* Mobile top bar */}
      <MobileTopBar />

      {/* Page content */}
      {children}

      {/* Mobile bottom nav */}
      <BottomNav />
    </>
  );
}
