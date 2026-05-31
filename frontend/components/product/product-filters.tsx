import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { Category, ProductFilters } from "@/lib/api/types";

type ProductFiltersProps = {
  filters: ProductFilters;
  categories: Category[];
  onChange: (next: ProductFilters) => void;
  onApply: () => void;
  onReset: () => void;
};

export function ProductFiltersPanel({
  filters,
  categories,
  onChange,
  onApply,
  onReset
}: ProductFiltersProps) {
  return (
    <Card className="space-y-4">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate">Product Filters</p>

      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate">Search</label>
        <Input
          placeholder="Name or description..."
          value={filters.search ?? ""}
          onChange={(event) => onChange({ ...filters, search: event.target.value, page: 1 })}
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate">Category</label>
        <Select
          value={filters.categoryId ?? ""}
          onChange={(event) =>
            onChange({
              ...filters,
              categoryId: event.target.value || undefined,
              page: 1
            })
          }
        >
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate">Min price</label>
          <Input
            type="number"
            min={0}
            value={filters.minPrice ?? ""}
            onChange={(event) =>
              onChange({
                ...filters,
                minPrice: event.target.value ? Number(event.target.value) : undefined,
                page: 1
              })
            }
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate">Max price</label>
          <Input
            type="number"
            min={0}
            value={filters.maxPrice ?? ""}
            onChange={(event) =>
              onChange({
                ...filters,
                maxPrice: event.target.value ? Number(event.target.value) : undefined,
                page: 1
              })
            }
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate">Sort by</label>
        <Select
          value={filters.sortBy ?? "newest"}
          onChange={(event) =>
            onChange({
              ...filters,
              sortBy: event.target.value as ProductFilters["sortBy"],
              page: 1
            })
          }
        >
          <option value="newest">Newest</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
          <option value="name_asc">Name (A-Z)</option>
        </Select>
      </div>

      <div className="flex gap-2">
        <Button className="flex-1" onClick={onApply}>
          Apply
        </Button>
        <Button variant="ghost" className="flex-1" onClick={onReset}>
          Reset
        </Button>
      </div>
    </Card>
  );
}
