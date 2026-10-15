import type { ReactNode } from "react";
import AdminNavigation from "../../components/AdminNavigation";

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <AdminNavigation />
      {children}
    </>
  );
}