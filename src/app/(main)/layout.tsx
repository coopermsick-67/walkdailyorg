/**
 * Layout wrapper for the main authenticated section.
 * All tabs share the root layout's nav bars; this adds any shared
 * state or guards needed across the 5 main tabs.
 */
export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary-500 focus:text-white focus:rounded-lg"
      >
        Skip to main content
      </a>
      <main id="main-content">
        {children}
      </main>
    </>
  );
}
