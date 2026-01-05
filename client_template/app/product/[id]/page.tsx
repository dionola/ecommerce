"use client"

import { useState, useMemo, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Minus, Plus, ArrowLeft } from "lucide-react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel"
import { cn } from "@/lib/utils"

// Data source (in a real app this would be an API or DB)
const products = [
  {
    id: 49,
    name: "Wool-blend Throw",
    price: 89,
    images: [
      "https://image.hm.com/assets/hm/1a/3c/1a3c77208f05c2cf02bbdd5d0d71016abcd23548.jpg?imwidth=2160",
      "/wool-texture-detail.jpg",
      "/blanket-on-sofa.jpg",
    ],
    category: "Textiles",
    inStock: true,
    origin: "switzerland",
    description:
      "Experience the tactile elegance of our Swiss-designed Wool-blend Throw. Crafted with a focus on structural integrity and thermal efficiency, this piece features a substantial weave that provides both weight and breathability.",
  },
  {
    id: 45,
    name: "Glass Table Lamp",
    price: 129,
    images: [
      "https://image.hm.com/assets/hm/d3/7b/d37b8f20136076bdeed52645ca123492eacb5f6c.jpg?imwidth=2160",
      "/lamp-lighting-detail.jpg",
      "/lamp-on-desk.jpg",
    ],
    category: "Lighting",
    inStock: true,
    origin: "germany",
    description:
      "A study in transparency and form. The Glass Table Lamp utilizes hand-blown crystalline glass to diffuse light with architectural precision, creating a neutral yet commanding presence in any functional space.",
  },
  {
    id: 48,
    name: "Percale Duvet Set",
    price: 149,
    images: ["https://image.hm.com/assets/hm/80/73/8073d2bf4c80262ea4de2f9950f062f7207541e4.jpg?imwidth=2160"],
    category: "Bedding",
    inStock: true,
    origin: "italy",
    description: "A premium percale duvet set with a crisp, cool touch.",
  },
  {
    id: 44,
    name: "Metal Table Lamp",
    price: 110,
    images: ["https://image.hm.com/assets/hm/4d/17/4d178ef8d7ae0bb92748abccf79a53bf58f6b4a3.jpg?imwidth=2160"],
    category: "Lighting",
    inStock: false,
    origin: "france",
    description: "Industrial metal table lamp with a minimalist silhouette.",
  },
  {
    id: 41,
    name: "Blackout Curtains",
    price: 75,
    images: ["https://image.hm.com/assets/hm/a1/ff/a1ff3fde44a9f2d84ae82efad1246ba0ef7d2b81.jpg?imwidth=2160"],
    category: "Textiles",
    inStock: true,
    origin: "spain",
    description: "High-density blackout curtains for optimal light control.",
  },
  {
    id: 31,
    name: "Pleated Lampshade",
    price: 45,
    images: ["https://image.hm.com/assets/hm/09/a7/09a737bda834d7b9ae9c0635e797291e1d9ff9a7.jpg?imwidth=2160"],
    category: "Lighting",
    inStock: true,
    origin: "portugal",
    description: "Classic pleated lampshade with a refined texture.",
  },
]

export default function ProductPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = use(paramsPromise)
  const router = useRouter()
  const [api, setApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [cart, setCart] = useState<any[]>([])

  const product = useMemo(() => {
    const foundProduct = products.find((p) => p.id === Number(params.id))
    return foundProduct || products[0]
  }, [params.id])

  useEffect(() => {
    if (!api) return
    setCurrent(api.selectedScrollSnap())
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap())
    })
  }, [api])

  const handleAddToCart = () => {
    console.log(`[v0] Added ${quantity} of ${product.name} to cart`)
  }

  return (
    <main className="min-h-screen bg-background font-sans selection:bg-black selection:text-white">
      <Navbar cartCount={cart.reduce((acc, item) => acc + item.quantity, 0)} />

      <div className="max-w-[1400px] mx-auto px-6 py-12">
        <button
          onClick={() => router.back()}
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
                {product.images.map((image, index) => (
                  <CarouselItem key={index}>
                    <div className="aspect-[3/4] bg-secondary overflow-hidden">
                      <img
                        src={image || "/placeholder.svg"}
                        alt={`${product.name} - View ${index + 1}`}
                        className="w-full h-full object-cover grayscale"
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-4 h-12 w-12 rounded-none border-none bg-background/80 hover:bg-background" />
              <CarouselNext className="right-4 h-12 w-12 rounded-none border-none bg-background/80 hover:bg-background" />
            </Carousel>

            {/* Thumbnails */}
            <div className="flex gap-4">
              {product.images.map((image, index) => (
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
          </div>

          {/* Right: Product Details */}
          <div className="lg:col-span-5 flex flex-col justify-between py-4">
            <div>
              <div className="flex items-center gap-4 mb-8">
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] px-4 py-1.5 bg-black text-white">
                  {product.category}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">
                  ID NO. {product.id}
                </span>
              </div>

              <h1 className="text-6xl font-bold uppercase tracking-tighter mb-6 leading-[0.9]">{product.name}</h1>

              <p className="text-3xl font-bold tracking-tighter mb-12">${product.price}.00</p>

              <div className="space-y-8 text-sm text-muted-foreground uppercase tracking-widest leading-relaxed border-t border-border pt-8">
                <p className="text-black font-medium leading-normal lowercase first-letter:uppercase">
                  {product.description}
                </p>
                <div className="grid grid-cols-2 gap-y-4">
                  <div>
                    <span className="block font-bold text-black text-[10px] mb-1">Origin</span>
                    {product.origin}
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
