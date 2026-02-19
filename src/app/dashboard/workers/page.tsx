import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import WorkersSearch from "@/components/workers/WorkersSearch";

export default async function WorkersPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/auth/signin");
  }

  if (false) {
    redirect("/dashboard");
  }

  return <WorkersSearch />;
}