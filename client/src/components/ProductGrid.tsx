import { ProductFilters } from "./ProductFilters"
import { useCart } from "../contexts/CartContext"
import { useAuth } from "../contexts/AuthContext"
import { Grid3x3, List, Loader2 } from "lucide-react"
import { ProductGridSkeleton } from "./product-grid/ProductGridSkeleton"
import { ProductGridContent } from "./product-grid/ProductGridContent"
import { useProductGridState } from "../hooks/useProductGridState"

export function ProductGrid({ defaultFiltersOpen = false }: { defaultFiltersOpen?: boolean } = {}) {
  const { addItem } = useCart()
  const { isAuthenticated } = useAuth()
  const {
    products,
    loading,
    error,
    filters,
    viewMode,
    wishlistProductIds,
    hasMore,
    isLoadingMore,
    sentinelRef,
    productGridRef,
    setFilters,
    setViewMode,
    handleAddToCart,
    handleToggleWishlist,
  } = useProductGridState({ isAuthenticated, addItem })

  return (
    <section ref={productGridRef} id="collection" data-product-grid className="px-6 py-20 max-w-[1400px] mx-auto border-t border-border">
      <ProductFilters 
        onFilterChange={(newFilters) => setFilters((prev) => ({ ...prev, ...newFilters }))}
        initialCategory={filters.category}
        currentFilters={filters}
        defaultOpen={defaultFiltersOpen}
      />

      <div className="flex justify-between items-end mb-12">
        <div>
          <h2 className="text-4xl font-bold tracking-tighter uppercase">Catalog</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 transition-colors ${viewMode === "grid" ? "bg-black text-white" : "bg-secondary hover:bg-secondary/80"}`}
            aria-label="Grid view"
          >
            <Grid3x3 className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 transition-colors ${viewMode === "list" ? "bg-black text-white" : "bg-secondary hover:bg-secondary/80"}`}
            aria-label="List view"
          >
            <List className="w-5 h-5" />
          </button>
        </div>
      </div>

      {error && (
        <div className="text-center text-destructive py-12">{error}</div>
      )}

      {loading && products.length === 0 ? (
        <ProductGridSkeleton />
      ) : (
        <ProductGridContent
          products={products}
          viewMode={viewMode}
          isAuthenticated={isAuthenticated}
          wishlistProductIds={wishlistProductIds}
          onToggleWishlist={handleToggleWishlist}
          onAddToCart={handleAddToCart}
        />
      )}

      {/* Infinite scroll sentinel and loading indicator */}
      {!loading && (
        <div ref={sentinelRef} className="h-10 flex items-center justify-center mt-12">
          {isLoadingMore && (
            <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
          )}
          {!hasMore && products.length > 0 && !isLoadingMore && (
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">No more products</p>
          )}
        </div>
      )}
    </section>
  )
}
