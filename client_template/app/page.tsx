"use client"

import { useState } from "react"
import { Navbar } from "@/components/navbar"
import { Hero } from "@/components/hero"
import { ProductGrid } from "@/components/product-grid"
import { Footer } from "@/components/footer"

export default function Home() {
  const [cart, setCart] = useState<any[]>([])

  const addToCart = (product: any, quantity: number) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id)
      if (existing) {
        return prev.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item))
      }
      return [...prev, { ...product, quantity }]
    })
  }

  const updateQuantity = (id: number, delta: number) => {
    setCart((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item)),
    )
  }

  const removeItem = (id: number) => {
    setCart((prev) => prev.filter((item) => item.id !== id))
  }

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <main className="min-h-screen bg-background font-sans selection:bg-primary selection:text-primary-foreground">
      <Navbar cartCount={cartCount} cartItems={cart} onUpdateQuantity={updateQuantity} onRemoveItem={removeItem} />
      <Hero />
      <ProductGrid onAddToCart={addToCart} />
      <Footer />
    </main>
  )
}
