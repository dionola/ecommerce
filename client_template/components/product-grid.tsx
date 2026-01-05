"use client"

import { useState } from "react"
import Link from "next/link"
import { ProductFilters } from "./product-filters"

const products = [
  {
    id: 49,
    name: "Wool-blend Throw",
    price: 89,
    image: "https://image.hm.com/assets/hm/1a/3c/1a3c77208f05c2cf02bbdd5d0d71016abcd23548.jpg?imwidth=2160",
    category: "Textiles",
    inStock: true,
    origin: "switzerland",
    createdAt: "2025-01-01",
  },
  {
    id: 45,
    name: "Glass Table Lamp",
    price: 129,
    image: "https://image.hm.com/assets/hm/d3/7b/d37b8f20136076bdeed52645ca123492eacb5f6c.jpg?imwidth=2160",
    category: "Lighting",
    inStock: true,
    origin: "germany",
    createdAt: "2024-12-15",
  },
  {
    id: 48,
    name: "Percale Duvet Set",
    price: 149,
    image: "https://image.hm.com/assets/hm/80/73/8073d2bf4c80262ea4de2f9950f062f7207541e4.jpg?imwidth=2160",
    category: "Bedding",
    inStock: true,
    origin: "italy",
    createdAt: "2024-11-30",
  },
  {
    id: 44,
    name: "Metal Table Lamp",
    price: 110,
    image: "https://image.hm.com/assets/hm/4d/17/4d178ef8d7ae0bb92748abccf79a53bf58f6b4a3.jpg?imwidth=2160",
    category: "Lighting",
    inStock: false,
    origin: "france",
    createdAt: "2024-10-20",
  },
  {
    id: 41,
    name: "Blackout Curtains",
    price: 75,
    image: "https://image.hm.com/assets/hm/a1/ff/a1ff3fde44a9f2d84ae82efad1246ba0ef7d2b81.jpg?imwidth=2160",
    category: "Textiles",
    inStock: true,
    origin: "spain",
    createdAt: "2024-09-10",
  },
  {
    id: 31,
    name: "Pleated Lampshade",
    price: 45,
    image: "https://image.hm.com/assets/hm/09/a7/09a737bda834d7b9ae9c0635e797291e1d9ff9a7.jpg?imwidth=2160",
    category: "Lighting",
    inStock: true,
    origin: "portugal",
    createdAt: "2024-08-01",
  },
]

export function ProductGrid({ onAddToCart }: { onAddToCart: (product: any, qty: number) => void }) {
  const [filters, setFilters] = useState<any>({})

  const filteredProducts = products
    .filter((p) => {
      if (filters.search && !p.name.toLowerCase().includes(filters.search.toLowerCase())) return false
      if (filters.min_price && p.price < filters.min_price) return false
      if (filters.max_price && p.price > filters.max_price) return false
      if (filters.country_of_origin && p.origin !== filters.country_of_origin) return false
      if (filters.in_stock && !p.inStock) return false
      return true
    })
    .sort((a, b) => {
      if (filters.sort_by === "price_asc") return a.price - b.price
      if (filters.sort_by === "price_desc") return b.price - a.price
      if (filters.sort_by === "name") return a.name.localeCompare(b.name)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

  return (
    <section className="px-6 py-20 max-w-[1400px] mx-auto border-t border-border">
      <ProductFilters onFilterChange={(newFilters) => setFilters((prev) => ({ ...prev, ...newFilters }))} />

      <div className="flex justify-between items-end mb-12">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground block mb-2">
            New Arrivals
          </span>
          <h2 className="text-4xl font-bold tracking-tighter uppercase">Selected Items</h2>
        </div>
        <div className="hidden md:block">
          <p className="text-sm font-medium uppercase tracking-widest underline underline-offset-8 cursor-pointer hover:text-muted-foreground transition-colors">
            View All Products
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
        {filteredProducts.map((product) => (
          <Link key={product.id} href={`/product/${product.id}`} className="group block">
            <div className="aspect-[3/4] overflow-hidden bg-secondary mb-6 relative">
              <img
                src={product.image || "/placeholder.svg"}
                alt={product.name}
                className="w-full h-full object-cover grayscale hover:grayscale-0 group-hover:scale-105 transition-all duration-700 ease-out"
              />
              <div className="absolute top-4 right-4 bg-background px-3 py-1 text-[10px] font-bold uppercase tracking-widest">
                {product.category}
              </div>
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
              <p className="font-bold text-lg tracking-tighter">${product.price}.00</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
