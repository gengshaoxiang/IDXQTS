"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import clsx from "clsx";

type User = {
  id: string;
  name: string;
  role: string;
  title: string;
  deptName: string;
};

const NAV = [
  { href: "/", label: "总览" },
  { href: "/tasks", label: "我的评价" },
  { href: "/calibration", label: "校准看板" },
  { href: "/compliance", label: "风控熔断" },
  { href: "/admin", label: "周期管理" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);

  async function refresh() {
    const res = await fetch("/api/v1/session");
    const json = await res.json();
    setUser(json.data?.user ?? null);
    setUsers(json.data?.users ?? []);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function switchUser(userId: string) {
    await fetch("/api/v1/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    await refresh();
    window.location.reload();
  }

  return (
    <div className="atmosphere min-h-screen">
      <header className="border-b border-[var(--line)] bg-[rgba(243,239,230,0.78)] backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-4">
          <Link href="/" className="group flex items-baseline gap-3">
            <span className="font-display text-3xl tracking-tight text-ink">EES</span>
            <span className="hidden text-sm text-ink-soft sm:inline">
              集团高管在线评价系统
            </span>
            <span className="accent-line hidden h-px w-16 bg-sea sm:block" />
          </Link>

          <nav className="flex flex-wrap items-center gap-1 text-sm">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "rounded-md px-3 py-1.5 transition",
                  pathname === item.href
                    ? "bg-sea text-white"
                    : "text-ink-soft hover:bg-black/5 hover:text-ink",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex max-w-full flex-col items-end gap-1 text-xs sm:text-sm">
            <span className="text-ink-soft">
              演示身份
              {user ? `：${user.name}` : "：未选择"}
            </span>
            <div className="flex max-w-[520px] flex-wrap justify-end gap-1">
              {users
                .filter((u) =>
                  ["U_HRD", "U_AUDIT", "U_CEO", "U_SUB1", "U_PEER1"].includes(u.id),
                )
                .map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => switchUser(u.id)}
                    className={clsx(
                      "rounded-md border px-2 py-1 transition",
                      user?.id === u.id
                        ? "border-sea bg-sea text-white"
                        : "border-[var(--line)] bg-white/70 text-ink-soft hover:border-sea/40 hover:text-ink",
                    )}
                  >
                    {u.name}
                  </button>
                ))}
            </div>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-8">{children}</main>
    </div>
  );
}
