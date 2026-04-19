import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { CafeForm } from "@/components/admin/CafeForm";
import { MenuItemsManager } from "@/components/admin/MenuItemsManager";
import { CafeImagesManager } from "@/components/admin/CafeImagesManager";
import { DeleteCafeButton } from "@/components/admin/DeleteCafeButton";
import { getCafeWithRelations } from "@/lib/queries/admin/cafes";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCafePage({ params }: PageProps) {
  const { id } = await params;
  const cafe = await getCafeWithRelations(id);
  if (!cafe) notFound();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/admin/cafes"
            className="inline-flex items-center gap-1.5 text-sm text-neutral-600 transition-colors hover:text-neutral-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to cafes
          </Link>
          <h2 className="mt-3 text-2xl font-semibold text-neutral-900">
            {cafe.name}
          </h2>
          <p className="mt-1 text-sm text-neutral-500">/cafes/{cafe.slug}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/cafes/${cafe.slug}`} target="_blank">
              <ExternalLink className="mr-1.5 h-4 w-4" />
              View public page
            </Link>
          </Button>
          <DeleteCafeButton cafeId={cafe.id} cafeName={cafe.name} />
        </div>
      </div>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="menu">Menu ({cafe.menuItems.length})</TabsTrigger>
          <TabsTrigger value="gallery">
            Gallery ({cafe.images.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-4">
          <CafeForm cafe={cafe} />
        </TabsContent>

        <TabsContent value="menu" className="mt-4">
          <MenuItemsManager cafeId={cafe.id} items={cafe.menuItems} />
        </TabsContent>

        <TabsContent value="gallery" className="mt-4">
          <CafeImagesManager cafeId={cafe.id} images={cafe.images} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
