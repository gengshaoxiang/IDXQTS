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
  email?: string;
  simulated?: boolean;
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
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/v1/session", { method: "POST" })
      .then(async (r) => {
        const json = await r.json().catch(() => ({}));
        if (!r.ok) {
          setAuthError(json.message ?? "需要 Cursor 登录");
          setUser(null);
          return;
        }
        setUser(json.data?.user ?? null);
        setAuthError(null);
      })
      .catch(() => setAuthError("无法验证登录状态"));
  }, []);

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

          <div className="text-right text-xs sm:text-sm">
            {user ? (
              <>
                <p className="font-medium text-ink">{user.name}</p>
                <p className="text-ink-soft">
                  {user.role.replace("ROLE_", "")}
                  {user.simulated ? " · 本地模拟身份" : " · Cursor 登录"}
                </p>
              </>
            ) : (
              <p className="text-copper">{authError ?? "验证登录中…"}</p>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-8">{children}</main>
    </div>
  );
}
