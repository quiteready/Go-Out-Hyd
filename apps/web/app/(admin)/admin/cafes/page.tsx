import Link from "next/link";
import { Plus, Pencil, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listCafesWithCounts } from "@/lib/queries/admin/cafes";

export const dynamic = "force-dynamic";

export default async function AdminCafesPage() {
  const cafes = await listCafesWithCounts();

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-neutral-900">Cafes</h2>
          <p className="mt-1 text-sm text-neutral-600">
            {cafes.length} total
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/cafes/new">
            <Plus className="mr-1.5 h-4 w-4" />
            New cafe
          </Link>
        </Button>
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white">
        {cafes.length === 0 ? (
          <p className="p-10 text-center text-sm text-neutral-500">
            No cafes yet. Create your first one to get started.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Area</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Events</TableHead>
                <TableHead className="text-right">Menu</TableHead>
                <TableHead className="text-right">Photos</TableHead>
                <TableHead className="w-32" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {cafes.map((cafe) => (
                <TableRow key={cafe.id}>
                  <TableCell className="font-medium text-neutral-900">
                    {cafe.name}
                    <p className="text-xs font-normal text-neutral-500">
                      /{cafe.slug}
                    </p>
                  </TableCell>
                  <TableCell className="text-neutral-700">{cafe.area}</TableCell>
                  <TableCell>
                    <Badge
                      variant={cafe.status === "active" ? "default" : "secondary"}
                    >
                      {cafe.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {cafe.eventCount}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {cafe.menuItemCount}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {cafe.imageCount}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        asChild
                        variant="ghost"
                        size="icon"
                        aria-label="View public page"
                      >
                        <Link href={`/cafes/${cafe.slug}`} target="_blank">
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        asChild
                        variant="ghost"
                        size="icon"
                        aria-label="Edit"
                      >
                        <Link href={`/admin/cafes/${cafe.id}`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
