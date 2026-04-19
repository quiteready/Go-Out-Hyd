import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { EventForm } from "@/components/admin/EventForm";
import { listCafesForPicker } from "@/lib/queries/admin/events";

export const dynamic = "force-dynamic";

export default async function NewEventPage() {
  const cafes = await listCafesForPicker();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link
          href="/admin/events"
          className="inline-flex items-center gap-1.5 text-sm text-neutral-600 transition-colors hover:text-neutral-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to events
        </Link>
        <h2 className="mt-3 text-2xl font-semibold text-neutral-900">
          New event
        </h2>
        <p className="mt-1 text-sm text-neutral-600">
          Pick an existing cafe or toggle on a custom venue (e.g. pop-ups,
          residential studios).
        </p>
      </div>

      <EventForm cafes={cafes} />
    </div>
  );
}
