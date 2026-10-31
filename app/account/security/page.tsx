import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser, countSessions } from "@/lib/auth";
import SecurityForms from "@/components/account/SecurityForms";

export default function SecurityPage() {
  return (
    <main className="mx-auto w-full max-w-xl px-4 py-6">
      <Suspense fallback={<p className="text-gray-500">Loading...</p>}>
        <SecurityContent />
      </Suspense>
    </main>
  );
}

async function SecurityContent() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const sessions = await countSessions(user.id);
  const isAdmin = user.role === "ADMIN";

  return (
    <>
      <Link
        href={isAdmin ? "/admin" : "/account"}
        className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-pink-600"
      >
        <ArrowLeft size={16} />
        {isAdmin ? "Admin panel" : "My account"}
      </Link>

      <h1 className="mb-6 text-2xl font-bold">Password and security</h1>

      <SecurityForms minLength={isAdmin ? 12 : 8} sessions={sessions} />
    </>
  );
}