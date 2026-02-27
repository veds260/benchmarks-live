import { categoryTag, cn } from "@/lib/utils";
import { CATEGORY_LABELS } from "@/lib/types";
import { Category } from "@/lib/types";

export function CategoryBadge({
  category,
  size = "sm",
}: {
  category: string;
  size?: "sm" | "md";
}) {
  const tag = categoryTag(category);

  const sizeClass = size === "md"
    ? "text-[11px] px-2 py-0.5"
    : "text-[10px] px-1.5 py-px";

  return (
    <span
      className={cn(
        "font-mono-nums font-medium rounded border inline-flex items-center shrink-0",
        tag.color,
        tag.bg,
        sizeClass
      )}
      title={CATEGORY_LABELS[category as Category] || category}
    >
      {tag.abbr}
    </span>
  );
}
