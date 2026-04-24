import { useState, useEffect, useMemo } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Button } from "../components/ui/button"
import { Minus, Plus, ArrowLeft, Heart } from "lucide-react"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "../components/ui/carousel"
import { cn } from "../lib/utils"
import { getProduct } from "../services/products"
import { type Product, mapProductDtoToProduct } from "../types/product"
import { useCart } from "../contexts/CartContext"
import { useAuth } from "../contexts/AuthContext"
import { addToWishlist, removeFromWishlist, getWishlist } from "../services/wishlists"
import { toast } from "../components/ui/toaster"
import { formatCurrency } from "../lib/currency"

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [api, setApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isInWishlist, setIsInWishlist] = useState(false)
  const { addItem } = useCart()
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return

      setLoading(true)
      setError(null)
      try {
        const productDto = await getProduct(Number(id))
        const mappedProduct = mapProductDtoToProduct(productDto)
        setProduct(mappedProduct)

        // Check if product is in wishlist
        if (isAuthenticated) {
          try {
            const wishlist = await getWishlist()
            setIsInWishlist(wishlist.items.some(item => item.product.id === mappedProduct.id))
          } catch {
            // Silently fail
          }
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load product')
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [id, isAuthenticated])

  useEffect(() => {
    if (!api) return
    setCurrent(api.selectedScrollSnap())
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap())
    })
  }, [api])

  const images = useMemo(() => {
    if (!product) return []
    return product.images.length > 0
      ? product.images.map((img: any) => img.url)
      : [product.mainImage || "/placeholder.svg"]
  }, [product])

  const handleAddToCart = async () => {
    if (!product) return

    try {
      await addItem(product.id, quantity)
      toast({
        title: "Added to cart",
        description: `${quantity} ${product.name} has been added to your cart`,
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

  const handleToggleWishlist = async () => {
    if (!product || !isAuthenticated) {
      toast({
        title: "Sign in required",
        description: 'Please sign in to add items to your wishlist',
        variant: "default",
      })
      return
    }

    try {
      if (isInWishlist) {
        await removeFromWishlist(product.id)
        setIsInWishlist(false)
        toast({
          title: "Removed from wishlist",
          variant: "success",
        })
      } else {
        await addToWishlist(product.id)
        setIsInWishlist(true)
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
      <div className="max-w-[1400px] mx-auto px-6 py-12">
        <div className="text-center text-muted-foreground">Loading product...</div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="max-w-[1400px] mx-auto px-6 py-12">
        <div className="text-center text-destructive">{error || 'Product not found'}</div>
        <div className="flex justify-center mt-4">
          <Button onClick={() => navigate('/')}>
            Back to Home
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-12">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] mb-12 hover:opacity-50 transition-opacity"
      >
        <ArrowLeft className="w-3 h-3" />
        Back to Catalog
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
        {/* Left: Image Carousel & Thumbnails */}
        <div className="lg:col-span-7 space-y-6">
          <Carousel setApi={setApi} className="w-full">
            <CarouselContent>
              {images.map((image: string, index: number) => (
                <CarouselItem key={index}>
                  <div className="aspect-[3/4] bg-secondary overflow-hidden">
                    <img
                      src={image || "/placeholder.svg"}
                      alt={`${product.name} - View ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-4 h-12 w-12 rounded-none border-none bg-background/80 hover:bg-background" />
            <CarouselNext className="right-4 h-12 w-12 rounded-none border-none bg-background/80 hover:bg-background" />
          </Carousel>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-4">
              {images.map((image: string, index: number) => (
                <button
                  key={index}
                  onClick={() => api?.scrollTo(index)}
                  className={cn(
                    "w-24 aspect-[3/4] bg-secondary overflow-hidden border-2 transition-all duration-300",
                    current === index ? "border-black" : "border-transparent opacity-50 grayscale",
                  )}
                >
                  <img src={image || "/placeholder.svg"} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Product Details */}
        <div className="lg:col-span-5 flex flex-col justify-between py-4">
          <div>
            <div className="flex items-center gap-4 mb-8">
              {/* <span className="text-[10px] font-bold uppercase tracking-[0.3em] px-4 py-1.5 bg-black text-white">
                {product.country_of_origin || "Unknown"}
              </span> */}
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">
                ID NO. {product.id}
              </span>
            </div>

            <div className="flex items-start justify-between mb-6">
              <h1 className="text-6xl font-bold uppercase tracking-tighter leading-[0.9] flex-1">{product.name}</h1>
              {isAuthenticated && (
                <button
                  onClick={handleToggleWishlist}
                  className="p-3 hover:bg-secondary transition-colors ml-4"
                  aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
                >
                  <Heart className={`w-6 h-6 ${isInWishlist ? 'fill-red-500 text-red-500' : ''}`} />
                </button>
              )}
            </div>

            <p className="text-3xl font-bold tracking-tighter mb-12">{formatCurrency(product.price)}</p>

            <div className="space-y-8 text-sm text-muted-foreground uppercase tracking-widest leading-relaxed border-t border-border pt-8">
              {product.description && (
                <p className="text-black font-medium leading-normal lowercase first-letter:uppercase">
                  {product.description}
                </p>
              )}
              <div className="grid grid-cols-2 gap-y-4">
                <div>
                  <span className="block font-bold text-black text-[10px] mb-1">Origin</span>
                  {product.country_of_origin || "Unknown"}
                </div>
                <div>
                  <span className="block font-bold text-black text-[10px] mb-1">Availability</span>
                  {product.inStock ? "In Stock" : "Out of Stock"}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-16 space-y-8">
            <div className="flex items-center justify-between border-y border-border py-6">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Select Quantity</span>
              <div className="flex items-center gap-8">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="hover:scale-125 transition-transform"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-lg font-bold w-4 text-center">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="hover:scale-125 transition-transform">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <Button
              onClick={handleAddToCart}
              disabled={!product.inStock}
              className="w-full rounded-none h-20 text-xs font-bold uppercase tracking-[0.4em] bg-black hover:bg-zinc-900 text-white disabled:bg-zinc-300"
            >
              {product.inStock ? "Add to Shopping Bag" : "Currently Unavailable"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
