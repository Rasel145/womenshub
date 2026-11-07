import Link from "next/link";
import { User, Shield } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";

export default async function UserMenu() {
  const user = await getCurrentUser();

  return (
    <>
      {user?.role === "ADMIN" && (
        <Link
          href="/admin"
          aria-label="Admin panel"
          className="flex items-center gap-1 rounded-full bg-pink-50 px-2.5 py-1 text-xs font-medium text-pink-700 hover:bg-pink-100"
        >
          <Shield size={14} />
          <span className="hidden sm:inline">Admin</span>
        </Link>
      )}

      <Link
        href={user ? "/account" : "/login"}
        aria-label={user ? "My account" : "Login"}
        className="flex items-center gap-1.5 text-sm"
      >
        {user?.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.avatarUrl}
            alt=""
            className="h-7 w-7 rounded-full border object-cover"
          />
        ) : (
          <User size={22} />
        )}
        {user && (
          <span className="hidden max-w-24 truncate md:inline">
            {user.name.split(" ")[0]}
          </span>
        )}
      </Link>
    </>
  );
}