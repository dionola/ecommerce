import { useState } from "react"
import { Input } from "./ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Switch } from "./ui/switch"
import { Label } from "./ui/label"
import { Search, SlidersHorizontal } from "lucide-react"

export interface ProductFilters {
  search?: string
  min_price?: number
  max_price?: number
  country_of_origin?: string
  in_stock?: boolean
  sort_by?: "name" | "price" | "created_at"
  order?: "asc" | "desc"
}

export function ProductFilters({ onFilterChange }: { onFilterChange: (filters: ProductFilters) => void }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="mb-12 border-b border-border pb-8">
      <div className="flex flex-wrap items-center justify-between gap-6">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search Collection..."
            className="pl-12 h-12 rounded-none border-none bg-secondary text-xs uppercase font-bold tracking-widest focus-visible:ring-0"
            onChange={(e) => onFilterChange({ search: e.target.value })}
          />
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-3 px-6 h-12 bg-black text-white text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-zinc-800 transition-colors"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
        </button>
      </div>

      {isOpen && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-8 p-8 bg-secondary animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="space-y-4">
            <Label className="text-[10px] font-bold uppercase tracking-widest">Price Range</Label>
            <div className="flex items-center gap-4">
              <Input
                type="number"
                placeholder="Min"
                className="rounded-none border-border bg-background text-xs uppercase"
                onChange={(e) => onFilterChange({ min_price: Number(e.target.value) || undefined })}
              />
              <Input
                type="number"
                placeholder="Max"
                className="rounded-none border-border bg-background text-xs uppercase"
                onChange={(e) => onFilterChange({ max_price: Number(e.target.value) || undefined })}
              />
            </div>
          </div>

          <div className="space-y-4">
            <Label className="text-[10px] font-bold uppercase tracking-widest">Sort By</Label>
            <Select onValueChange={(val) => {
              if (val === "price_asc") {
                onFilterChange({ sort_by: "price", order: "asc" })
              } else if (val === "price_desc") {
                onFilterChange({ sort_by: "price", order: "desc" })
              } else if (val === "name") {
                onFilterChange({ sort_by: "name" })
              } else {
                onFilterChange({ sort_by: "created_at", order: "desc" })
              }
            }}>
              <SelectTrigger className="rounded-none border-border bg-background text-xs uppercase font-bold tracking-widest">
                <SelectValue placeholder="Latest" />
              </SelectTrigger>
              <SelectContent className="rounded-none border-border">
                <SelectItem value="created_at" className="text-xs uppercase font-bold">
                  Newest
                </SelectItem>
                <SelectItem value="price_asc" className="text-xs uppercase font-bold">
                  Price: Low to High
                </SelectItem>
                <SelectItem value="price_desc" className="text-xs uppercase font-bold">
                  Price: High to Low
                </SelectItem>
                <SelectItem value="name" className="text-xs uppercase font-bold">
                  Name
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <Label className="text-[10px] font-bold uppercase tracking-widest">Origin</Label>
            <Select onValueChange={(val) => onFilterChange({ country_of_origin: val })}>
              <SelectTrigger className="rounded-none border-border bg-background text-xs uppercase font-bold tracking-widest">
                <SelectValue placeholder="All Regions" />
              </SelectTrigger>
              <SelectContent className="rounded-none border-border">
                <SelectItem value="switzerland" className="text-xs uppercase font-bold">
                  Switzerland
                </SelectItem>
                <SelectItem value="germany" className="text-xs uppercase font-bold">
                  Germany
                </SelectItem>
                <SelectItem value="denmark" className="text-xs uppercase font-bold">
                  Denmark
                </SelectItem>
                <SelectItem value="italy" className="text-xs uppercase font-bold">
                  Italy
                </SelectItem>
                <SelectItem value="france" className="text-xs uppercase font-bold">
                  France
                </SelectItem>
                <SelectItem value="spain" className="text-xs uppercase font-bold">
                  Spain
                </SelectItem>
                <SelectItem value="portugal" className="text-xs uppercase font-bold">
                  Portugal
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-4 mt-auto h-12">
            <Switch
              id="in-stock"
              className="data-[state=checked]:bg-black"
              onCheckedChange={(checked) => onFilterChange({ in_stock: checked || undefined })}
            />
            <Label htmlFor="in-stock" className="text-[10px] font-bold uppercase tracking-widest cursor-pointer">
              In Stock Only
            </Label>
          </div>
        </div>
      )}
    </div>
  )
}

