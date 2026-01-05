"use client"

import Link from "next/link"
import { ShoppingCart, Menu, User } from "lucide-react"
import { useState } from "react"
import { CartSheet } from "./cart-sheet"
import { AuthModal } from "./auth-modal"

export function Navbar({ cartCount, cartItems, onUpdateQuantity, onRemoveItem }: any) {
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isAuthOpen, setIsAuthOpen] = useState(false)

  return (
    <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-[1400px] mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-12">
          <Link href="/" className="text-2xl font-bold tracking-tighter uppercase">
            Objekt
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium uppercase tracking-widest text-muted-foreground">
            <Link href="#" className="hover:text-foreground transition-colors underline-offset-4 hover:underline">
              Collection
            </Link>
            <Link href="#" className="hover:text-foreground transition-colors underline-offset-4 hover:underline">
              Archive
            </Link>
            <Link href="#" className="hover:text-foreground transition-colors underline-offset-4 hover:underline">
              Studio
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <button onClick={() => setIsAuthOpen(true)} className="p-2 hover:bg-secondary transition-colors rounded-full">
            <User className="w-5 h-5" />
          </button>
          <button
            onClick={() => setIsCartOpen(true)}
            className="p-2 hover:bg-secondary transition-colors rounded-full relative"
          >
            <ShoppingCart className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute top-0 right-0 w-4 h-4 bg-primary text-[10px] text-primary-foreground flex items-center justify-center rounded-full font-bold">
                {cartCount}
              </span>
            )}
          </button>
          <button className="md:hidden p-2 hover:bg-secondary transition-colors rounded-full">
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>
      <CartSheet
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={onUpdateQuantity}
        onRemoveItem={onRemoveItem}
      />
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </nav>
  )
}
