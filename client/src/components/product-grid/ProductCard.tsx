import { Link } from "react-router-dom"
import { Heart } from "lucide-react"
import { ProductStatusBadge } from "../ProductStatusBadge"
import { formatCurrency } from "../../lib/currency"

interface ProductCardProps {
  product: any
  isAuthenticated: boolean
  isWishlisted: boolean
  onToggleWishlist: (event: React.MouseEvent, productId: number) => void
  onAddToCart: (product: any, quantity?: number) => void
}

export function ProductCard({
  product,
  isAuthenticated,
  isWishlisted,
  onToggleWishlist,
  onAddToCart,
}: ProductCardProps) {
  return (
    <div className="group block">
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
          <p className="font-bold text-lg tracking-tighter">{formatCurrency(product.price)}</p>
        </div>
      </Link>
      {product.inStock && (
        <button
          onClick={(event) => {
            event.preventDefault()
            onAddToCart(product, 1)
          }}
          className="mt-4 w-full bg-black text-white px-4 py-2 text-xs font-bold uppercase tracking-widest hover:bg-zinc-800 transition-colors"
        >
          Add to Cart
        </button>
      )}
    </div>
  )
}
