import { ProductCard } from "./ProductCard"
import { ProductListItem } from "./ProductListItem"

interface ProductGridContentProps {
  products: any[]
  viewMode: "grid" | "list"
  isAuthenticated: boolean
  wishlistProductIds: Set<number>
  pendingCartProductIds: Set<number>
  onToggleWishlist: (event: React.MouseEvent, productId: number) => void
  onAddToCart: (product: any, quantity?: number) => void
}

export function ProductGridContent({
  products,
  viewMode,
  isAuthenticated,
  wishlistProductIds,
  pendingCartProductIds,
  onToggleWishlist,
  onAddToCart,
}: ProductGridContentProps) {
  return (
    <div className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16" : "space-y-8"}>
      {products.map((product) =>
        viewMode === "grid" ? (
          <ProductCard
            key={product.id}
            product={product}
            isAuthenticated={isAuthenticated}
            isWishlisted={wishlistProductIds.has(product.id)}
            isAddingToCart={pendingCartProductIds.has(product.id)}
            onToggleWishlist={onToggleWishlist}
            onAddToCart={onAddToCart}
          />
        ) : (
          <ProductListItem
            key={product.id}
            product={product}
            isAuthenticated={isAuthenticated}
            isWishlisted={wishlistProductIds.has(product.id)}
            isAddingToCart={pendingCartProductIds.has(product.id)}
            onToggleWishlist={onToggleWishlist}
            onAddToCart={onAddToCart}
          />
        )
      )}
    </div>
  )
}
