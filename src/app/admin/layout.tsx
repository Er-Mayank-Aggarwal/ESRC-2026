import { Metadata } from "next";
import AdminClientLayout from "./AdminClientLayout";
import { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Admin ESRC",
  manifest: "/manifest-admin.json",
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminClientLayout>{children}</AdminClientLayout>;
}
