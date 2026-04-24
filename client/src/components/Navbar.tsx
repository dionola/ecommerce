import { Link } from "react-router-dom"
import { ShoppingCart, Menu, X } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { CartSheet } from "./CartSheet"
import { AuthModal } from "./AuthModal"
import { useCart } from "../contexts/CartContext"
import { useAuth } from "../contexts/AuthContext"
import { UserMenu } from "./navbar/UserMenu"
import { MobileMenu } from "./navbar/MobileMenu"

export function Navbar() {
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { cartCount } = useCart()
  const { isAuthenticated, user, signOut } = useAuth()
  const userDropdownRef = useRef<HTMLDivElement>(null)
  const isAdmin = user?.groups?.includes('admin') || false
  const isSuperAdmin = user?.groups?.includes('superadmin') || false

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false)
      }
    }

    if (isUserDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isUserDropdownOpen])

  return (
    <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-[1400px] mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-12">
          <Link to="/" className="text-2xl font-bold tracking-tighter uppercase">
            dionola
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium uppercase tracking-widest text-muted-foreground">
            <Link
              to="/#collection"
              className="hover:text-foreground transition-colors underline-offset-4 hover:underline"
            >
              Catalog
            </Link>
            <Link to="/about" className="hover:text-foreground transition-colors underline-offset-4 hover:underline">
              About
            </Link>
            <Link to="/contact" className="hover:text-foreground transition-colors underline-offset-4 hover:underline">
              Contact
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <UserMenu
            isAuthenticated={isAuthenticated}
            email={user?.email}
            groups={user?.groups}
            isOpen={isUserDropdownOpen}
            onToggle={() => setIsUserDropdownOpen((open) => !open)}
            onClose={() => setIsUserDropdownOpen(false)}
            onSignIn={() => setIsAuthOpen(true)}
            onSignOut={async () => {
              await signOut()
              setIsUserDropdownOpen(false)
              window.location.href = "/"
            }}
            userDropdownRef={userDropdownRef}
          />
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
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 hover:bg-secondary transition-colors rounded-full"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>
      <MobileMenu
        isAuthenticated={isAuthenticated}
        isAdmin={isAdmin}
        isSuperAdmin={isSuperAdmin}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />
      <CartSheet
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
      />
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </nav>
  )
}
