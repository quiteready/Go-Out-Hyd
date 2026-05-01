import Image from "next/image";
import type { CafeImage } from "@/lib/drizzle/schema";

interface PhotoGalleryProps {
  images: CafeImage[];
  cafeName: string;
}

export function PhotoGallery({ images, cafeName }: PhotoGalleryProps) {
  return (
    <section>
      <h2 className="mb-4 text-3xl font-medium text-foreground">Gallery</h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {images.map((image) => (
          <div
            key={image.id}
            className="relative aspect-square overflow-hidden rounded-lg"
          >
            <Image
              src={image.imageUrl}
              alt={image.altText ?? cafeName}
              fill
              sizes="(max-width: 768px) 50vw, 33vw"
              className="object-cover"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
