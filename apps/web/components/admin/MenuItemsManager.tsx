"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import {
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  toggleMenuItemAvailability,
} from "@/app/actions/admin/menu-items";
import type { MenuItem } from "@/lib/drizzle/schema";

interface MenuItemsManagerProps {
  cafeId: string;
  items: MenuItem[];
}

interface DraftValues {
  category: string;
  name: string;
  price: string; // string in UI, parsed to int on submit
  description: string;
  isAvailable: boolean;
}

const EMPTY_DRAFT: DraftValues = {
  category: "",
  name: "",
  price: "",
  description: "",
  isAvailable: true,
};

function fromItem(item: MenuItem): DraftValues {
  return {
    category: item.category,
    name: item.name,
    price: String(item.price),
    description: item.description ?? "",
    isAvailable: item.isAvailable ?? true,
  };
}

export function MenuItemsManager({ cafeId, items }: MenuItemsManagerProps) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<DraftValues>(EMPTY_DRAFT);
  const [pending, startTransition] = useTransition();

  const grouped = items.reduce<Record<string, MenuItem[]>>((acc, item) => {
    const key = item.category || "Uncategorized";
    (acc[key] ??= []).push(item);
    return acc;
  }, {});

  function startCreate(): void {
    setEditingId(null);
    setCreating(true);
    setDraft({
      ...EMPTY_DRAFT,
      // Pre-fill with the most recent category for convenience.
      category: items[0]?.category ?? "",
    });
  }

  function startEdit(item: MenuItem): void {
    setCreating(false);
    setEditingId(item.id);
    setDraft(fromItem(item));
  }

  function cancelDraft(): void {
    setEditingId(null);
    setCreating(false);
    setDraft(EMPTY_DRAFT);
  }

  function submitDraft(): void {
    const priceNum = Number(draft.price);
    if (!draft.category.trim() || !draft.name.trim()) {
      toast.error("Category and name are required");
      return;
    }
    if (!Number.isFinite(priceNum) || !Number.isInteger(priceNum) || priceNum < 0) {
      toast.error("Price must be a whole non-negative number");
      return;
    }

    startTransition(async () => {
      const payload = {
        category: draft.category.trim(),
        name: draft.name.trim(),
        price: priceNum,
        description: draft.description.trim() || undefined,
        isAvailable: draft.isAvailable,
        sortOrder: 0,
      };

      const result = creating
        ? await createMenuItem(cafeId, payload)
        : editingId
          ? await updateMenuItem(editingId, payload)
          : { success: false as const, error: "Nothing to save" };

      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(creating ? "Menu item added" : "Menu item updated");
      cancelDraft();
      router.refresh();
    });
  }

  function handleToggle(id: string): void {
    startTransition(async () => {
      const result = await toggleMenuItemAvailability(id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      router.refresh();
    });
  }

  async function handleDelete(id: string): Promise<void> {
    const result = await deleteMenuItem(id);
    if (!result.success) {
      toast.error(result.error);
      throw new Error(result.error);
    }
    toast.success("Menu item deleted");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-600">
          {items.length} item{items.length === 1 ? "" : "s"}
        </p>
        <Button
          type="button"
          size="sm"
          onClick={startCreate}
          disabled={pending || creating}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Add menu item
        </Button>
      </div>

      {creating && (
        <DraftRow
          draft={draft}
          setDraft={setDraft}
          onSave={submitDraft}
          onCancel={cancelDraft}
          pending={pending}
        />
      )}

      {Object.keys(grouped).length === 0 && !creating && (
        <p className="rounded-md border border-dashed border-neutral-300 bg-neutral-50 p-6 text-center text-sm text-neutral-500">
          No menu items yet.
        </p>
      )}

      <div className="space-y-5">
        {Object.entries(grouped)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([category, list]) => (
            <div key={category} className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                {category}
              </h4>
              <ul className="divide-y divide-neutral-200 rounded-md border border-neutral-200 bg-white">
                {list.map((item) =>
                  editingId === item.id ? (
                    <li key={item.id} className="p-3">
                      <DraftRow
                        draft={draft}
                        setDraft={setDraft}
                        onSave={submitDraft}
                        onCancel={cancelDraft}
                        pending={pending}
                      />
                    </li>
                  ) : (
                    <li
                      key={item.id}
                      className="flex flex-wrap items-center gap-3 p-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-medium text-neutral-900">
                            {item.name}
                          </p>
                          {!(item.isAvailable ?? true) && (
                            <Badge variant="secondary">Hidden</Badge>
                          )}
                        </div>
                        {item.description && (
                          <p className="mt-0.5 line-clamp-1 text-xs text-neutral-500">
                            {item.description}
                          </p>
                        )}
                      </div>
                      <div className="text-sm font-medium text-neutral-900">
                        ₹{item.price}
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-neutral-500">
                          {item.isAvailable ? "Available" : "Hidden"}
                        </span>
                        <Switch
                          checked={item.isAvailable ?? true}
                          onCheckedChange={() => handleToggle(item.id)}
                          disabled={pending}
                          aria-label="Toggle availability"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => startEdit(item)}
                          disabled={pending}
                          aria-label="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <ConfirmDialog
                          trigger={
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              aria-label="Delete"
                              disabled={pending}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          }
                          title="Delete menu item?"
                          description={`"${item.name}" will be permanently removed.`}
                          confirmLabel="Delete"
                          destructive
                          onConfirm={() => handleDelete(item.id)}
                        />
                      </div>
                    </li>
                  ),
                )}
              </ul>
            </div>
          ))}
      </div>
    </div>
  );
}

function DraftRow({
  draft,
  setDraft,
  onSave,
  onCancel,
  pending,
}: {
  draft: DraftValues;
  setDraft: (v: DraftValues) => void;
  onSave: () => void;
  onCancel: () => void;
  pending: boolean;
}) {
  return (
    <div className="space-y-3 rounded-md border border-neutral-200 bg-neutral-50 p-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Input
          placeholder="Category (e.g. Coffee, Snacks)"
          value={draft.category}
          onChange={(e) => setDraft({ ...draft, category: e.target.value })}
          disabled={pending}
        />
        <Input
          placeholder="Name"
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          disabled={pending}
        />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Input
          type="number"
          min={0}
          step={1}
          placeholder="Price (₹)"
          value={draft.price}
          onChange={(e) => setDraft({ ...draft, price: e.target.value })}
          disabled={pending}
        />
        <div className="flex items-center gap-2">
          <Switch
            checked={draft.isAvailable}
            onCheckedChange={(v) => setDraft({ ...draft, isAvailable: v })}
            disabled={pending}
            id="draft-available"
          />
          <label htmlFor="draft-available" className="text-sm text-neutral-700">
            Available
          </label>
        </div>
      </div>
      <Textarea
        placeholder="Description (optional)"
        value={draft.description}
        onChange={(e) => setDraft({ ...draft, description: e.target.value })}
        rows={2}
        disabled={pending}
      />
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCancel}
          disabled={pending}
        >
          <X className="mr-1.5 h-4 w-4" />
          Cancel
        </Button>
        <Button type="button" size="sm" onClick={onSave} disabled={pending}>
          {pending ? (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          ) : (
            <Check className="mr-1.5 h-4 w-4" />
          )}
          Save
        </Button>
      </div>
    </div>
  );
}
