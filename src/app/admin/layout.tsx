import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopbar } from "@/components/admin/AdminTopbar";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  // The login page renders inside this layout too (because /admin/login is
  // under /admin), but the middleware also lets it through. We redirect from
  // here only if the user isn't on the login page – server components can't
  // easily know the path, so we let the middleware handle redirects and only
  // render the bare children when there's no session (which means we're on
  // /admin/login).
  if (!session) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-neutral-100">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar username={session.username} />
        <main className="flex-1 px-4 py-6 md:px-8">{children}</main>
      </div>
    </div>
  );
}
