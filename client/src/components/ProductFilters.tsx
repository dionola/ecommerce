import { useState, useEffect, useRef } from "react"
import { Input } from "./ui/input"
import { Search, SlidersHorizontal } from "lucide-react"
import { getCategories } from "../services/categories"
import { CategoryFilter } from "./product-filters/CategoryFilter"
import { FilterSelects } from "./product-filters/FilterSelects"

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

export function ProductFilters({ onFilterChange, initialCategory, currentFilters, defaultOpen = false }: { onFilterChange: (filters: ProductFilters) => void; initialCategory?: string; currentFilters?: ProductFilters; defaultOpen?: boolean }) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
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
            placeholder="Search Catalog..."
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
          <CategoryFilter
            categories={categories}
            selectedCategories={selectedCategories}
            categorySearch={categorySearch}
            isOpen={isCategoryDropdownOpen}
            dropdownRef={categoryDropdownRef}
            onToggleOpen={() => setIsCategoryDropdownOpen((open) => !open)}
            onSearchChange={setCategorySearch}
            onToggleCategory={handleCategoryToggle}
            onClearCategories={handleClearCategories}
          />

          <FilterSelects
            minPrice={minPrice}
            maxPrice={maxPrice}
            selectedSort={selectedSort}
            selectedOrigin={selectedOrigin}
            inStockOnly={inStockOnly}
            onMinPriceChange={(value) => {
              setMinPrice(value)
              onFilterChange({ min_price: value ? Number(value) : undefined })
            }}
            onMaxPriceChange={(value) => {
              setMaxPrice(value)
              onFilterChange({ max_price: value ? Number(value) : undefined })
            }}
            onSortChange={(value) => {
              setSelectedSort(value)
              if (value === "price_asc") onFilterChange({ sort_by: "price", order: "asc" })
              else if (value === "price_desc") onFilterChange({ sort_by: "price", order: "desc" })
              else if (value === "name") onFilterChange({ sort_by: "name" })
              else onFilterChange({ sort_by: "created_at", order: "desc" })
            }}
            onOriginChange={(value) => {
              setSelectedOrigin(value)
              onFilterChange({ country_of_origin: value === "all" ? undefined : value })
            }}
            onStockChange={(checked) => {
              setInStockOnly(checked)
              onFilterChange({ in_stock: checked || undefined })
            }}
          />
        </div>
      )}
    </div>
  )
}
