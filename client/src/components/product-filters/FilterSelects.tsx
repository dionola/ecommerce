import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Switch } from "../ui/switch"
import { Label } from "../ui/label"

interface FilterSelectsProps {
  minPrice: string
  maxPrice: string
  selectedSort: string
  selectedOrigin: string
  inStockOnly: boolean
  onMinPriceChange: (value: string) => void
  onMaxPriceChange: (value: string) => void
  onSortChange: (value: string) => void
  onOriginChange: (value: string) => void
  onStockChange: (checked: boolean) => void
}

export function FilterSelects({
  minPrice,
  maxPrice,
  selectedSort,
  selectedOrigin,
  inStockOnly,
  onMinPriceChange,
  onMaxPriceChange,
  onSortChange,
  onOriginChange,
  onStockChange,
}: FilterSelectsProps) {
  return (
    <>
      <div className="space-y-4">
        <Label className="text-[10px] font-bold uppercase tracking-widest">Price Range</Label>
        <div className="flex items-center gap-4">
          <input
            type="number"
            placeholder="Min"
            value={minPrice}
            className="flex h-9 w-full rounded-none border border-border bg-background px-3 py-1 text-xs uppercase shadow-xs transition-[color,box-shadow] outline-none"
            onChange={(event) => onMinPriceChange(event.target.value)}
          />
          <input
            type="number"
            placeholder="Max"
            value={maxPrice}
            className="flex h-9 w-full rounded-none border border-border bg-background px-3 py-1 text-xs uppercase shadow-xs transition-[color,box-shadow] outline-none"
            onChange={(event) => onMaxPriceChange(event.target.value)}
          />
        </div>
      </div>

      <div className="space-y-4">
        <Label className="text-[10px] font-bold uppercase tracking-widest">Sort By</Label>
        <Select value={selectedSort} onValueChange={onSortChange}>
          <SelectTrigger className="rounded-none border-border bg-background text-xs uppercase font-bold tracking-widest">
            <SelectValue placeholder="Latest" />
          </SelectTrigger>
          <SelectContent className="rounded-none border-border">
            <SelectItem value="created_at" className="text-xs uppercase font-bold">Newest</SelectItem>
            <SelectItem value="price_asc" className="text-xs uppercase font-bold">Price: Low to High</SelectItem>
            <SelectItem value="price_desc" className="text-xs uppercase font-bold">Price: High to Low</SelectItem>
            <SelectItem value="name" className="text-xs uppercase font-bold">Name</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        <Label className="text-[10px] font-bold uppercase tracking-widest">Origin</Label>
        <Select value={selectedOrigin} onValueChange={onOriginChange}>
          <SelectTrigger className="rounded-none border-border bg-background text-xs uppercase font-bold tracking-widest">
            <SelectValue placeholder="All Regions" />
          </SelectTrigger>
          <SelectContent className="rounded-none border-border">
            <SelectItem value="all" className="text-xs uppercase font-bold">All Regions</SelectItem>
            <SelectItem value="sweden" className="text-xs uppercase font-bold">Sweden</SelectItem>
            <SelectItem value="switzerland" className="text-xs uppercase font-bold">Switzerland</SelectItem>
            <SelectItem value="germany" className="text-xs uppercase font-bold">Germany</SelectItem>
            <SelectItem value="denmark" className="text-xs uppercase font-bold">Denmark</SelectItem>
            <SelectItem value="italy" className="text-xs uppercase font-bold">Italy</SelectItem>
            <SelectItem value="france" className="text-xs uppercase font-bold">France</SelectItem>
            <SelectItem value="spain" className="text-xs uppercase font-bold">Spain</SelectItem>
            <SelectItem value="portugal" className="text-xs uppercase font-bold">Portugal</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-4 mt-auto h-12">
        <Switch
          id="in-stock"
          checked={inStockOnly}
          className="data-[state=checked]:bg-black"
          onCheckedChange={onStockChange}
        />
        <Label htmlFor="in-stock" className="text-[10px] font-bold uppercase tracking-widest cursor-pointer">
          In Stock Only
        </Label>
      </div>
    </>
  )
}
