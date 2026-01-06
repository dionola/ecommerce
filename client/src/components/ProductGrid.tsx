import { useState, useEffect, useRef } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { ProductFilters } from "./ProductFilters"
import { useCart } from "../contexts/CartContext"
import { useAuth } from "../contexts/AuthContext"
import { getProducts } from "../services/products"
import { mapProductDtoToProduct } from "../types/product"
import { ProductStatusBadge } from "./ProductStatusBadge"
import { addToWishlist, removeFromWishlist, getWishlist } from "../services/wishlists"
import { Heart, Grid3x3, List } from "lucide-react"
import { toast } from "./ui/toaster"
import type { ProductFilters as FilterType } from "./ProductFilters"

type ViewMode = "grid" | "list"

export function ProductGrid() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<FilterType>({})
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [searchParams] = useSearchParams()
  const { addItem } = useCart()
  const { isAuthenticated } = useAuth()
  const [wishlistProductIds, setWishlistProductIds] = useState<Set<number>>(new Set())
  const sentinelRef = useRef<HTMLDivElement>(null)
  const productGridRef = useRef<HTMLDivElement>(null)

  // Read category from URL params and scroll to grid
  useEffect(() => {
    const category = searchParams.get('category')
    if (category) {
      setFilters((prev) => ({ ...prev, category }))
      // Scroll to product grid when category is set
      setTimeout(() => {
        if (productGridRef.current) {
          productGridRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 100)
    }
  }, [searchParams])

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1)
    setProducts([])
  }, [filters])

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      if (page === 1) {
        setLoading(true)
      } else {
        setIsLoadingMore(true)
      }
      setError(null)
      try {
        // Convert categories array to query params
        const queryParams: any = { ...filters, page, limit: 20 }
        // If categories array is provided, use it and remove single category
        if (filters.categories && filters.categories.length > 0) {
          queryParams.categories = filters.categories
          delete queryParams.category
        }
        const response = await getProducts(queryParams)
        const mappedProducts = response.products.map(mapProductDtoToProduct)
        
        if (page === 1) {
          setProducts(mappedProducts)
        } else {
          setProducts((prev) => [...prev, ...mappedProducts])
        }
        
        setHasMore(response.hasMore)
      } catch (err: any) {
        setError(err.message || 'Failed to load products')
      } finally {
        setLoading(false)
        setIsLoadingMore(false)
      }
    }

    fetchProducts()
  }, [filters, page])

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore && !loading) {
          setPage((prev) => prev + 1)
        }
      },
      { threshold: 0.1 }
    )

    const currentSentinel = sentinelRef.current
    if (currentSentinel) {
      observer.observe(currentSentinel)
    }

    return () => {
      if (currentSentinel) {
        observer.unobserve(currentSentinel)
      }
    }
  }, [hasMore, isLoadingMore, loading])

  // Load wishlist on mount
  useEffect(() => {
    if (isAuthenticated) {
      loadWishlist()
    }
  }, [isAuthenticated])

  // Scroll to grid when hash is present or when navigating to collection
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash
      if (hash === '#collection') {
        setTimeout(() => {
          if (productGridRef.current) {
            productGridRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }
        }, 100)
      }
    }

    // Check on mount
    handleHashChange()

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  const loadWishlist = async () => {
    try {
      const wishlist = await getWishlist()
      const productIds = new Set(wishlist.items.map(item => item.product.id))
      setWishlistProductIds(productIds)
    } catch (err) {
      // Silently fail - user might not have wishlist yet
    }
  }

  const handleAddToCart = async (product: any, quantity: number = 1) => {
    try {
      await addItem(product.id, quantity)
      toast({
        title: "Added to cart",
        description: `${product.name} has been added to your cart`,
        variant: "success",
      })
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || 'Failed to add to cart',
        variant: "destructive",
      })
    }
  }

  const handleToggleWishlist = async (e: React.MouseEvent, productId: number) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!isAuthenticated) {
      toast({
        title: "Sign in required",
        description: 'Please sign in to add items to your wishlist',
        variant: "default",
      })
      return
    }

    try {
      if (wishlistProductIds.has(productId)) {
        await removeFromWishlist(productId)
        setWishlistProductIds(prev => {
          const newSet = new Set(prev)
          newSet.delete(productId)
          return newSet
        })
        toast({
          title: "Removed from wishlist",
          variant: "success",
        })
      } else {
        await addToWishlist(productId)
        setWishlistProductIds(prev => new Set(prev).add(productId))
        toast({
          title: "Added to wishlist",
          variant: "success",
        })
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || 'Failed to update wishlist',
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <section className="px-6 py-20 max-w-[1400px] mx-auto border-t border-border">
        <div className="text-center text-muted-foreground">Loading products...</div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="px-6 py-20 max-w-[1400px] mx-auto border-t border-border">
        <div className="text-center text-destructive">{error}</div>
      </section>
    )
  }

  return (
    <section ref={productGridRef} id="collection" className="px-6 py-20 max-w-[1400px] mx-auto border-t border-border">
      <ProductFilters 
        onFilterChange={(newFilters) => setFilters((prev) => ({ ...prev, ...newFilters }))}
        initialCategory={filters.category}
        currentFilters={filters}
      />

      <div className="flex justify-between items-end mb-12">
        <div>
          <h2 className="text-4xl font-bold tracking-tighter uppercase">Collection</h2>
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

      <div className={viewMode === "grid" 
        ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16"
        : "space-y-8"
      }>
        {products.map((product) => (
          viewMode === "grid" ? (
            <div key={product.id} className="group block">
              <Link to={`/product/${product.id}`} className="block">
                <div className="aspect-[3/4] overflow-hidden bg-secondary mb-6 relative group/image">
                  <img
                    src={product.mainImage || "/placeholder.svg"}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700 ease-out"
                  />
                  <ProductStatusBadge statuses={product.statuses || []} />
                  {isAuthenticated && (
                    <button
                      onClick={(e) => handleToggleWishlist(e, product.id)}
                      className="absolute top-4 right-4 p-2 bg-background/80 backdrop-blur-sm hover:bg-background transition-colors opacity-0 group-hover/image:opacity-100"
                      aria-label={wishlistProductIds.has(product.id) ? "Remove from wishlist" : "Add to wishlist"}
                    >
                      <Heart className={`w-5 h-5 ${wishlistProductIds.has(product.id) ? 'fill-red-500 text-red-500' : ''}`} />
                    </button>
                  )}
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold uppercase tracking-tight group-hover:underline decoration-2 underline-offset-4">
                      {product.name}
                    </h3>
                    <p className="text-sm text-muted-foreground uppercase tracking-widest mt-1">
                      Reference No. {product.id}
                    </p>
                  </div>
                  <p className="font-bold text-lg tracking-tighter">${product.price.toFixed(2)}</p>
                </div>
              </Link>
              {product.inStock && (
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    handleAddToCart(product, 1)
                  }}
                  className="mt-4 w-full bg-black text-white px-4 py-2 text-xs font-bold uppercase tracking-widest hover:bg-zinc-800 transition-colors"
                >
                  Add to Cart
                </button>
              )}
            </div>
          ) : (
            <div key={product.id} className="group flex gap-8 border-b border-border pb-8">
              <Link to={`/product/${product.id}`} className="flex-shrink-0 w-48 h-64 overflow-hidden bg-secondary relative group/image">
                <img
                  src={product.mainImage || "/placeholder.svg"}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700 ease-out"
                />
                <ProductStatusBadge statuses={product.statuses || []} />
                {isAuthenticated && (
                  <button
                    onClick={(e) => handleToggleWishlist(e, product.id)}
                    className="absolute top-4 right-4 p-2 bg-background/80 backdrop-blur-sm hover:bg-background transition-colors opacity-0 group-hover/image:opacity-100"
                    aria-label={wishlistProductIds.has(product.id) ? "Remove from wishlist" : "Add to wishlist"}
                  >
                    <Heart className={`w-5 h-5 ${wishlistProductIds.has(product.id) ? 'fill-red-500 text-red-500' : ''}`} />
                  </button>
                )}
              </Link>
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <Link to={`/product/${product.id}`} className="block">
                    <h3 className="text-2xl font-bold uppercase tracking-tight group-hover:underline decoration-2 underline-offset-4 mb-2">
                      {product.name}
                    </h3>
                    <p className="text-sm text-muted-foreground uppercase tracking-widest mb-4">
                      Reference No. {product.id}
                    </p>
                    {product.description && (
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {product.description}
                      </p>
                    )}
                  </Link>
                </div>
                <div className="flex items-center justify-between">
                  <p className="font-bold text-2xl tracking-tighter">${product.price.toFixed(2)}</p>
                  {product.inStock && (
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        handleAddToCart(product, 1)
                      }}
                      className="bg-black text-white px-6 py-2 text-xs font-bold uppercase tracking-widest hover:bg-zinc-800 transition-colors"
                    >
                      Add to Cart
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        ))}
      </div>

      {/* Infinite scroll sentinel and loading indicator */}
      <div ref={sentinelRef} className="h-10 flex items-center justify-center mt-12">
        {isLoadingMore && (
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Loading more products...</p>
        )}
        {!hasMore && products.length > 0 && !isLoadingMore && (
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">No more products</p>
        )}
      </div>
    </section>
  )
}

