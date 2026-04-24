import { useEffect, useRef, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { getProducts } from "../services/products"
import { mapProductDtoToProduct } from "../types/product"
import { addToWishlist, getWishlist, removeFromWishlist } from "../services/wishlists"
import { toast } from "../components/ui/toaster"
import type { ProductFilters as FilterType } from "../components/ProductFilters"

type ViewMode = "grid" | "list"

interface UseProductGridStateArgs {
  isAuthenticated: boolean
  addItem: (productId: number, quantity?: number) => Promise<void>
}

export function useProductGridState({ isAuthenticated, addItem }: UseProductGridStateArgs) {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<FilterType>({})
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [wishlistProductIds, setWishlistProductIds] = useState<Set<number>>(new Set())
  const [searchParams] = useSearchParams()
  const sentinelRef = useRef<HTMLDivElement>(null)
  const productGridRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const category = searchParams.get("category")
    if (category) {
      setFilters((prev) => ({ ...prev, category }))
      window.setTimeout(() => {
        productGridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      }, 100)
    }
  }, [searchParams])

  useEffect(() => {
    setPage(1)
    setLoading(true)
    setProducts([])
    setError(null)
  }, [filters])

  useEffect(() => {
    const fetchProducts = async () => {
      if (page === 1) setLoading(true)
      else setIsLoadingMore(true)

      setError(null)
      try {
        const queryParams: any = { ...filters, page, limit: 20 }
        if (filters.categories && filters.categories.length > 0) {
          queryParams.categories = filters.categories
          delete queryParams.category
        }
        const response = await getProducts(queryParams)
        const mappedProducts = response.products.map(mapProductDtoToProduct)
        setProducts((prev) => (page === 1 ? mappedProducts : [...prev, ...mappedProducts]))
        setHasMore(response.hasMore)
      } catch (err: any) {
        setError(err.message || "Failed to load products")
      } finally {
        setLoading(false)
        setIsLoadingMore(false)
      }
    }

    void fetchProducts()
  }, [filters, page])

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
    if (currentSentinel) observer.observe(currentSentinel)

    return () => {
      if (currentSentinel) observer.unobserve(currentSentinel)
    }
  }, [hasMore, isLoadingMore, loading])

  useEffect(() => {
    if (!isAuthenticated) return

    const loadWishlist = async () => {
      try {
        const wishlist = await getWishlist()
        setWishlistProductIds(new Set(wishlist.items.map((item) => item.product.id)))
      } catch {
        // Ignore missing wishlist state for guests/new users.
      }
    }

    void loadWishlist()
  }, [isAuthenticated])

  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === "#collection") {
        window.setTimeout(() => {
          productGridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
        }, 100)
      }
    }

    handleHashChange()
    window.addEventListener("hashchange", handleHashChange)
    return () => window.removeEventListener("hashchange", handleHashChange)
  }, [])

  const handleAddToCart = async (product: any, quantity = 1) => {
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
        description: err.message || "Failed to add to cart",
        variant: "destructive",
      })
    }
  }

  const handleToggleWishlist = async (event: React.MouseEvent, productId: number) => {
    event.preventDefault()
    event.stopPropagation()

    if (!isAuthenticated) {
      toast({
        title: "Sign in required",
        description: "Please sign in to add items to your wishlist",
        variant: "default",
      })
      return
    }

    try {
      if (wishlistProductIds.has(productId)) {
        await removeFromWishlist(productId)
        setWishlistProductIds((prev) => {
          const next = new Set(prev)
          next.delete(productId)
          return next
        })
        toast({ title: "Removed from wishlist", variant: "success" })
      } else {
        await addToWishlist(productId)
        setWishlistProductIds((prev) => new Set(prev).add(productId))
        toast({ title: "Added to wishlist", variant: "success" })
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to update wishlist",
        variant: "destructive",
      })
    }
  }

  return {
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
  }
}
