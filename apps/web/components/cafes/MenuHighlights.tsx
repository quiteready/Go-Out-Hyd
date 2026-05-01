import type { MenuItem } from "@/lib/drizzle/schema";

interface MenuHighlightsProps {
  items: MenuItem[];
}

export function MenuHighlights({ items }: MenuHighlightsProps) {
  const grouped = items.reduce<Record<string, MenuItem[]>>((acc, item) => {
    (acc[item.category] ??= []).push(item);
    return acc;
  }, {});

  return (
    <section>
      <h2 className="mb-6 text-3xl font-medium text-foreground">
        Menu Highlights
      </h2>
      <div className="space-y-8">
        {Object.entries(grouped).map(([category, categoryItems]) => (
          <div key={category}>
            <h3 className="mb-3 text-xs font-medium uppercase tracking-widest text-muted-foreground">
              {category}
            </h3>
            <div className="space-y-3">
              {categoryItems.map((item) => (
                <div key={item.id}>
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="text-sm font-medium text-foreground">
                      {item.name}
                    </span>
                    <span className="shrink-0 text-sm text-muted-foreground">
                      ₹{item.price}
                    </span>
                  </div>
                  {item.description && (
                    <p className="mt-0.5 text-xs text-foreground/40">
                      {item.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
