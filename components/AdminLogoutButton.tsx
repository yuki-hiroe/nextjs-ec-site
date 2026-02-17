'use client';

import { signOut } from "next-auth/react";

export default function AdminLogoutButton() {
  return (
    <button onClick={() => signOut({ callbackUrl: "/admin/login" })}
    className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:border-slate-900"
    >ログアウト</button>
  );
}