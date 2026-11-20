// Admin pages get their own layout — no customer Navbar or Footer.
// The root layout's <html>/<body> still applies; this just omits the
// Navbar and Footer wrappers for every route under /admin.
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
