import { useState, useEffect, useRef } from "react"
import { Input } from "./ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Switch } from "./ui/switch"
import { Label } from "./ui/label"
import { Search, SlidersHorizontal, ChevronDown, X, Sofa, Lightbulb, Sparkles, Box, Shirt, ChefHat, Droplet, TreePine, Zap, Watch, Package } from "lucide-react"
import { getCategories } from "../services/categories"

export interface ProductFilters {
  search?: string
  min_price?: number
  max_price?: number
  country_of_origin?: string
  in_stock?: boolean
  sort_by?: "name" | "price" | "created_at"
  order?: "asc" | "desc"
  category?: string
  categories?: string[]
}

// Category to icon mapping (case-insensitive matching)
const getCategoryIcon = (category: string): typeof Package => {
  const normalized = category.toLowerCase().trim()
  
  const iconMap: Record<string, typeof Package> = {
    'furniture': Sofa,
    'lighting': Lightbulb,
    'decor': Sparkles,
    'decoration': Sparkles,
    'storage': Box,
    'textiles': Shirt,
    'textile': Shirt,
    'kitchen': ChefHat,
    'bathroom': Droplet,
    'bath': Droplet,
    'outdoor': TreePine,
    'electronics': Zap,
    'electronic': Zap,
    'accessories': Watch,
    'accessory': Watch,
  }
  
  return iconMap[normalized] || Package
}

export function ProductFilters({ onFilterChange, initialCategory, currentFilters }: { onFilterChange: (filters: ProductFilters) => void; initialCategory?: string; currentFilters?: ProductFilters }) {
  const [isOpen, setIsOpen] = useState(false)
  const [categories, setCategories] = useState<string[]>([])
  const [categorySearch, setCategorySearch] = useState("")
  const [selectedCategories, setSelectedCategories] = useState<string[]>(() => {
    if (currentFilters?.categories && currentFilters.categories.length > 0) {
      return currentFilters.categories
    }
    return initialCategory ? [initialCategory] : []
  })
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false)
  const categoryDropdownRef = useRef<HTMLDivElement>(null)
  
  // Local state for controlled inputs
  const [searchValue, setSearchValue] = useState(currentFilters?.search || "")
  const [minPrice, setMinPrice] = useState(currentFilters?.min_price?.toString() || "")
  const [maxPrice, setMaxPrice] = useState(currentFilters?.max_price?.toString() || "")
  const [selectedOrigin, setSelectedOrigin] = useState(currentFilters?.country_of_origin || "all")
  const [selectedSort, setSelectedSort] = useState(() => {
    if (currentFilters?.sort_by === "price" && currentFilters?.order === "asc") return "price_asc"
    if (currentFilters?.sort_by === "price" && currentFilters?.order === "desc") return "price_desc"
    if (currentFilters?.sort_by === "name") return "name"
    return "created_at"
  })
  const [inStockOnly, setInStockOnly] = useState(currentFilters?.in_stock || false)

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const cats = await getCategories()
        setCategories(cats)
      } catch (err) {
        console.error('Failed to load categories:', err)
      }
    }
    fetchCategories()
  }, [])

  useEffect(() => {
    if (currentFilters) {
      setSearchValue(currentFilters.search || "")
      setMinPrice(currentFilters.min_price?.toString() || "")
      setMaxPrice(currentFilters.max_price?.toString() || "")
      setSelectedOrigin(currentFilters.country_of_origin || "all")
      setInStockOnly(currentFilters.in_stock || false)
      if (currentFilters.categories && currentFilters.categories.length > 0) {
        setSelectedCategories(currentFilters.categories)
      } else if (initialCategory) {
        setSelectedCategories([initialCategory])
      } else {
        setSelectedCategories([])
      }
      if (currentFilters.sort_by === "price" && currentFilters.order === "asc") {
        setSelectedSort("price_asc")
      } else if (currentFilters.sort_by === "price" && currentFilters.order === "desc") {
        setSelectedSort("price_desc")
      } else if (currentFilters.sort_by === "name") {
        setSelectedSort("name")
      } else {
        setSelectedSort("created_at")
      }
    } else if (initialCategory) {
      setSelectedCategories([initialCategory])
    }
  }, [currentFilters, initialCategory])

  // Close category dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setIsCategoryDropdownOpen(false)
      }
    }

    if (isCategoryDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isCategoryDropdownOpen])

  const filteredCategories = categories.filter(cat =>
    cat.toLowerCase().includes(categorySearch.toLowerCase())
  )

  const handleCategoryToggle = (category: string) => {
    const newCategories = selectedCategories.includes(category)
      ? selectedCategories.filter(c => c !== category)
      : [...selectedCategories, category]
    setSelectedCategories(newCategories)
    if (newCategories.length > 0) {
      onFilterChange({ categories: newCategories, category: undefined })
    } else {
      onFilterChange({ categories: undefined, category: undefined })
    }
  }

  const handleClearCategories = () => {
    setSelectedCategories([])
    onFilterChange({ categories: undefined, category: undefined })
  }

  return (
    <div className="mb-12 border-b border-border pb-8">
      <div className="flex flex-wrap items-center justify-between gap-6">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search Collection..."
            value={searchValue}
            className="pl-12 h-12 rounded-none border-none bg-secondary text-xs uppercase font-bold tracking-widest focus-visible:ring-0"
            onChange={(e) => {
              setSearchValue(e.target.value)
              onFilterChange({ search: e.target.value || undefined })
            }}
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
            <Label className="text-[10px] font-bold uppercase tracking-widest">Category</Label>
            <div className="relative" ref={categoryDropdownRef}>
              <button
                type="button"
                onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                className="w-full flex items-center justify-between px-3 py-2 h-9 rounded-none border border-border bg-background text-xs uppercase font-bold tracking-widest hover:bg-secondary transition-colors"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {selectedCategories.length > 0 ? (
                    <span className="truncate">
                      {selectedCategories.length === 1 
                        ? selectedCategories[0]
                        : `${selectedCategories.length} Selected`
                      }
                    </span>
                  ) : (
                    <span className="text-muted-foreground">All Categories</span>
                  )}
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform shrink-0 ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {isCategoryDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border shadow-lg z-50 max-h-[300px] overflow-hidden flex flex-col">
                  <div className="p-2 border-b border-border">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search categories..."
                        value={categorySearch}
                        onChange={(e) => setCategorySearch(e.target.value)}
                        className="pl-8 h-8 text-xs rounded-none border-border"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                  <div className="overflow-y-auto max-h-[250px]">
                    {selectedCategories.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearCategories}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-secondary transition-colors flex items-center gap-2 text-muted-foreground"
                      >
                        <X className="w-4 h-4 shrink-0" />
                        <span>Clear All</span>
                      </button>
                    )}
                    {filteredCategories.length === 0 ? (
                      <div className="px-3 py-2 text-xs text-muted-foreground">No categories found</div>
                    ) : (
                      filteredCategories.map((category) => {
                        const Icon = getCategoryIcon(category)
                        const isSelected = selectedCategories.includes(category)
                        return (
                          <button
                            key={category}
                            type="button"
                            onClick={() => handleCategoryToggle(category)}
                            className={`w-full text-left px-3 py-2 text-xs hover:bg-secondary transition-colors flex items-center gap-2 ${isSelected ? 'bg-secondary' : ''}`}
                          >
                            <div className={`w-4 h-4 border border-border flex items-center justify-center shrink-0 ${isSelected ? 'bg-black border-black' : ''}`}>
                              {isSelected && <span className="text-white text-[10px]">✓</span>}
                            </div>
                            <Icon className="w-4 h-4 shrink-0" />
                            <span>{category}</span>
                          </button>
                        )
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <Label className="text-[10px] font-bold uppercase tracking-widest">Price Range</Label>
            <div className="flex items-center gap-4">
              <Input
                type="number"
                placeholder="Min"
                value={minPrice}
                className="rounded-none border-border bg-background text-xs uppercase"
                onChange={(e) => {
                  setMinPrice(e.target.value)
                  onFilterChange({ min_price: e.target.value ? Number(e.target.value) : undefined })
                }}
              />
              <Input
                type="number"
                placeholder="Max"
                value={maxPrice}
                className="rounded-none border-border bg-background text-xs uppercase"
                onChange={(e) => {
                  setMaxPrice(e.target.value)
                  onFilterChange({ max_price: e.target.value ? Number(e.target.value) : undefined })
                }}
              />
            </div>
          </div>

          <div className="space-y-4">
            <Label className="text-[10px] font-bold uppercase tracking-widest">Sort By</Label>
            <Select 
              value={selectedSort}
              onValueChange={(val) => {
                setSelectedSort(val)
                if (val === "price_asc") {
                  onFilterChange({ sort_by: "price", order: "asc" })
                } else if (val === "price_desc") {
                  onFilterChange({ sort_by: "price", order: "desc" })
                } else if (val === "name") {
                  onFilterChange({ sort_by: "name" })
                } else {
                  onFilterChange({ sort_by: "created_at", order: "desc" })
                }
              }}
            >
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
            <Select 
              value={selectedOrigin}
              onValueChange={(val) => {
                setSelectedOrigin(val)
                if (val === "all") {
                  onFilterChange({ country_of_origin: undefined })
                } else {
                  onFilterChange({ country_of_origin: val })
                }
              }}
            >
              <SelectTrigger className="rounded-none border-border bg-background text-xs uppercase font-bold tracking-widest">
                <SelectValue placeholder="All Regions" />
              </SelectTrigger>
              <SelectContent className="rounded-none border-border">
                <SelectItem value="all" className="text-xs uppercase font-bold">
                  All Regions
                </SelectItem>
                <SelectItem value="sweden" className="text-xs uppercase font-bold">
                  Sweden
                </SelectItem>
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
              checked={inStockOnly}
              className="data-[state=checked]:bg-black"
              onCheckedChange={(checked) => {
                setInStockOnly(checked)
                onFilterChange({ in_stock: checked || undefined })
              }}
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

