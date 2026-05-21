import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getSession } from "@/lib/auth";
import { Logo } from "@/components/Logo";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Admin – Prihlásenie" };

export default async function AdminLoginPage() {
  const session = await getSession();
  if (session) redirect("/admin");

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-100 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-md ring-1 ring-neutral-200">
        <div className="mb-6 flex justify-center">
          <Logo href="/" size="md" />
        </div>
        <h1 className="text-2xl font-bold text-neutral-900">Admin prihlásenie</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Vstup len pre administrátorov.
        </p>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
