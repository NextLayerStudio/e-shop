"use client";

import { useRouter } from "next/navigation";

export function AdminTopbar({ username }: { username: string }) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-3 md:px-8">
      <div className="text-sm text-neutral-500">Admin panel</div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-neutral-600">
          Prihlásený ako <span className="font-semibold">{username}</span>
        </span>
        <button
          type="button"
          onClick={logout}
          className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
        >
          Odhlásiť
        </button>
      </div>
    </header>
  );
}
