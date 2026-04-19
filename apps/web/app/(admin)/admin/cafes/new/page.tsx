import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CafeForm } from "@/components/admin/CafeForm";

export const dynamic = "force-dynamic";

export default function NewCafePage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/admin/cafes"
          className="inline-flex items-center gap-1.5 text-sm text-neutral-600 transition-colors hover:text-neutral-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to cafes
        </Link>
        <h2 className="mt-3 text-2xl font-semibold text-neutral-900">
          New cafe
        </h2>
      </div>

      <CafeForm />
    </div>
  );
}
