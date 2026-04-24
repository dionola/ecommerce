import { ChevronDown, Search, X } from "lucide-react"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { getCategoryIcon } from "./categoryIcons"

interface CategoryFilterProps {
  categories: string[]
  selectedCategories: string[]
  categorySearch: string
  isOpen: boolean
  dropdownRef: React.RefObject<HTMLDivElement | null>
  onToggleOpen: () => void
  onSearchChange: (value: string) => void
  onToggleCategory: (category: string) => void
  onClearCategories: () => void
}

export function CategoryFilter({
  categories,
  selectedCategories,
  categorySearch,
  isOpen,
  dropdownRef,
  onToggleOpen,
  onSearchChange,
  onToggleCategory,
  onClearCategories,
}: CategoryFilterProps) {
  const filteredCategories = categories.filter((category) =>
    category.toLowerCase().includes(categorySearch.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <Label className="text-[10px] font-bold uppercase tracking-widest">Category</Label>
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
            onToggleOpen()
          }}
          className="w-full flex items-center justify-between px-3 py-2 h-9 rounded-none border border-border bg-background text-xs uppercase font-bold tracking-widest hover:bg-secondary transition-colors"
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {selectedCategories.length > 0 ? (
              <span className="truncate">
                {selectedCategories.length === 1 ? selectedCategories[0] : `${selectedCategories.length} Selected`}
              </span>
            ) : (
              <span className="text-muted-foreground">All Categories</span>
            )}
          </div>
          <ChevronDown className={`w-4 h-4 transition-transform shrink-0 ${isOpen ? "rotate-180" : ""}`} />
        </button>
        {isOpen && (
          <div
            className="absolute bottom-full left-0 right-0 mb-1 bg-background border border-border shadow-lg z-50 max-h-[300px] overflow-hidden flex flex-col"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="p-2 border-b border-border">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search categories..."
                  value={categorySearch}
                  onChange={(event) => onSearchChange(event.target.value)}
                  className="pl-8 h-8 text-xs rounded-none border-border"
                  onClick={(event) => event.stopPropagation()}
                />
              </div>
            </div>
            <div className="overflow-y-auto max-h-[250px]">
              {selectedCategories.length > 0 && (
                <button
                  type="button"
                  onClick={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    onClearCategories()
                  }}
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
                      onClick={(event) => {
                        event.preventDefault()
                        event.stopPropagation()
                        onToggleCategory(category)
                      }}
                      className={`w-full text-left px-3 py-2 text-xs hover:bg-secondary transition-colors flex items-center gap-2 ${isSelected ? "bg-secondary" : ""}`}
                    >
                      <div className={`w-4 h-4 border border-border flex items-center justify-center shrink-0 ${isSelected ? "bg-black border-black" : ""}`}>
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
  )
}
