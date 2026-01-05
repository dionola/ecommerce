import { Badge } from "./ui/badge"

interface ProductStatusBadgeProps {
  statuses: string[];
}

// Status priority order: Featured > On Sale > Limited > Bestseller > New
const STATUS_PRIORITY: Record<string, number> = {
  featured: 1,
  on_sale: 2,
  limited: 3,
  bestseller: 4,
  new: 5,
};

const STATUS_VARIANTS: Record<string, "featured" | "onSale" | "new" | "bestseller" | "limited"> = {
  featured: "featured",
  on_sale: "onSale",
  limited: "limited",
  bestseller: "bestseller",
  new: "new",
};

const STATUS_LABELS: Record<string, string> = {
  featured: "Featured",
  on_sale: "On Sale",
  limited: "Limited",
  bestseller: "Bestseller",
  new: "New",
};

export function ProductStatusBadge({ statuses }: ProductStatusBadgeProps) {
  if (!statuses || statuses.length === 0) {
    return null;
  }

  // Sort statuses by priority
  const sortedStatuses = [...statuses].sort((a, b) => {
    const priorityA = STATUS_PRIORITY[a.toLowerCase()] || 999;
    const priorityB = STATUS_PRIORITY[b.toLowerCase()] || 999;
    return priorityA - priorityB;
  });

  return (
    <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
      {sortedStatuses.map((status) => {
        const normalizedStatus = status.toLowerCase();
        const variant = STATUS_VARIANTS[normalizedStatus] || "default";
        const label = STATUS_LABELS[normalizedStatus] || status;

        return (
          <Badge
            key={status}
            variant={variant}
            className="text-[10px] font-bold uppercase tracking-widest px-3 py-1"
          >
            {label}
          </Badge>
        );
      })}
    </div>
  );
}

