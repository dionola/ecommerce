import { Link } from "react-router-dom"
import { Heart } from "lucide-react"
import { ProductStatusBadge } from "../ProductStatusBadge"
import { formatCurrency } from "../../lib/currency"

interface ProductListItemProps {
  product: any
  isAuthenticated: boolean
  isWishlisted: boolean
  onToggleWishlist: (event: React.MouseEvent, productId: number) => void
  onAddToCart: (product: any, quantity?: number) => void
}

export function ProductListItem({
  product,
  isAuthenticated,
  isWishlisted,
  onToggleWishlist,
  onAddToCart,
}: ProductListItemProps) {
  return (
    <div className="group flex gap-8 border-b border-border pb-8">
      <Link to={`/product/${product.id}`} className="flex-shrink-0 w-48 h-64 overflow-hidden bg-secondary relative group/image">
        <img
          src={product.mainImage || "/placeholder.svg"}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700 ease-out"
        />
        <ProductStatusBadge statuses={product.statuses || []} />
        {isAuthenticated && (
          <button
            onClick={(event) => onToggleWishlist(event, product.id)}
            className={`absolute top-4 right-4 transition-all cursor-pointer ${
              isWishlisted
                ? "p-0 group-hover/image:p-2 group-hover/image:bg-background/80 group-hover/image:backdrop-blur-sm"
                : "p-2 bg-background/80 backdrop-blur-sm"
            } hover:bg-background`}
            aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart
              className={`w-5 h-5 transition-all ${
                isWishlisted ? "fill-red-500 text-red-500 hover:scale-110 hover:opacity-80" : ""
              }`}
            />
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
          <p className="font-bold text-2xl tracking-tighter">{formatCurrency(product.price)}</p>
          {product.inStock && (
            <button
              onClick={(event) => {
                event.preventDefault()
                onAddToCart(product, 1)
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
}
