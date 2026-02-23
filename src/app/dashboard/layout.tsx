import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import SimpleDashboardNav from "@/components/dashboard/SimpleDashboardNav";
import { Providers } from "@/components/providers/Providers";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <Providers>
      <div className="min-h-screen bg-background">
        <SimpleDashboardNav user={session.user} />
        <main className="pt-16">
          <div className="p-6 lg:p-8">
            <div className="mx-auto max-w-7xl">{children}</div>
          </div>
        </main>
      </div>
    </Providers>
  );
}
