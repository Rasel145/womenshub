import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import CategoryForm from "@/components/admin/CategoryForm";

export default function NewCategoryPage() {
  return (
    <Suspense fallback={<p className="text-gray-500">Loading...</p>}>
      <NewCategoryContent />
    </Suspense>
  );
}

async function NewCategoryContent() {
  await requireAdmin();

  return (
    <div>
      <Link
        href="/admin/categories"
        className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-pink-600"
      >
        <ArrowLeft size={16} />
        All categories
      </Link>
      <h1 className="mb-6 text-2xl font-bold">Add category</h1>

      <CategoryForm mode="create" />
    </div>
  );
}