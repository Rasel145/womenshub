import Link from "next/link";
import { User } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";

export default async function UserMenu() {
  const user = await getCurrentUser();

  return (
    <Link
      href={user ? "/account" : "/login"}
      aria-label={user ? "My account" : "Login"}
      className="flex items-center gap-1 text-sm"
    >
      <User size={22} />
      {user && (
        <span className="hidden max-w-24 truncate md:inline">
          {user.name.split(" ")[0]}
        </span>
      )}
    </Link>
  );
}