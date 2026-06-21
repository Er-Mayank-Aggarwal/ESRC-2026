"use client";

import { AuthProvider } from "@/components/AuthProvider";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { useEffect, type ReactNode } from "react";

function AdminGuard({ children }: { children: ReactNode }) {
  const { status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "unauthenticated" && pathname !== "/admin/login") {
      router.push("/admin/login");
    }
  }, [status, pathname, router]);

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  if (status === "loading") {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 rounded-full border-2 border-border-color border-t-accent animate-spin" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      {/* Admin Nav */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-text-primary">
            Admin Panel
          </h1>
          <p className="text-xs text-text-muted">
            Manage questions, teams, and scores
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-2 sm:mt-0">
          <AdminNavLink href="/admin/questions" label="Questions" />
          <AdminNavLink href="/admin/holidays" label="Holidays" />
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="rounded-md bg-danger/10 px-3 py-1.5 text-xs font-medium text-danger hover:bg-danger/20 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
      {children}
    </div>
  );
}

function AdminNavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link
      href={href}
      className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "bg-accent-glow text-accent"
          : "text-text-secondary hover:text-text-primary hover:bg-bg-tertiary"
      }`}
    >
      {label}
    </Link>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <AdminGuard>{children}</AdminGuard>
    </AuthProvider>
  );
}
