import { useState, useEffect, useMemo } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Button } from "../components/ui/button"
import { Minus, Plus, ArrowLeft } from "lucide-react"
import { Navbar } from "../components/Navbar"
import { Footer } from "../components/Footer"
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
import { mapProductDtoToProduct } from "../types/product"
import { useCart } from "../contexts/CartContext"

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [api, setApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { addItem } = useCart()

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return
      
      setLoading(true)
      setError(null)
      try {
        const productDto = await getProduct(Number(id))
        const mappedProduct = mapProductDtoToProduct(productDto)
        setProduct(mappedProduct)
      } catch (err: any) {
        setError(err.message || 'Failed to load product')
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [id])

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
      alert(`Added ${quantity} ${product.name} to cart`)
    } catch (err: any) {
      alert(err.message || 'Failed to add to cart')
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-background font-sans selection:bg-black selection:text-white">
        <Navbar />
        <div className="max-w-[1400px] mx-auto px-6 py-12">
          <div className="text-center text-muted-foreground">Loading product...</div>
        </div>
        <Footer />
      </main>
    )
  }

  if (error || !product) {
    return (
      <main className="min-h-screen bg-background font-sans selection:bg-black selection:text-white">
        <Navbar />
        <div className="max-w-[1400px] mx-auto px-6 py-12">
          <div className="text-center text-destructive">{error || 'Product not found'}</div>
          <Button onClick={() => navigate('/')} className="mt-4">
            Back to Home
          </Button>
        </div>
        <Footer />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background font-sans selection:bg-black selection:text-white">
      <Navbar />

      <div className="max-w-[1400px] mx-auto px-6 py-12">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] mb-12 hover:opacity-50 transition-opacity"
        >
          <ArrowLeft className="w-3 h-3" />
          Back to Collection
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          {/* Left: Image Carousel & Thumbnails */}
          <div className="lg:col-span-7 space-y-6">
            <Carousel setApi={setApi} className="w-full">
              <CarouselContent>
                {images.map((image, index) => (
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
                {images.map((image, index) => (
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
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] px-4 py-1.5 bg-black text-white">
                  {product.country_of_origin || "Unknown"}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">
                  ID NO. {product.id}
                </span>
              </div>

              <h1 className="text-6xl font-bold uppercase tracking-tighter mb-6 leading-[0.9]">{product.name}</h1>

              <p className="text-3xl font-bold tracking-tighter mb-12">${product.price.toFixed(2)}</p>

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

      <Footer />
    </main>
  )
}

