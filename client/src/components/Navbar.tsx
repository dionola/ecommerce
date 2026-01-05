import { Link, useNavigate } from "react-router-dom"
import { ShoppingCart, Menu, User, ChevronDown, X } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { CartSheet } from "./CartSheet"
import { AuthModal } from "./AuthModal"
import { useCart } from "../contexts/CartContext"
import { useAuth } from "../contexts/AuthContext"
import { getCategories } from "../services/categories"

export function Navbar() {
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [categories, setCategories] = useState<string[]>([])
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { cartCount } = useCart()
  const { isAuthenticated, signOut } = useAuth()
  const navigate = useNavigate()
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchCategories = async () => {
      setIsCategoriesLoading(true)
      try {
        const cats = await getCategories()
        setCategories(cats)
      } catch (err) {
        console.error('Failed to load categories:', err)
      } finally {
        setIsCategoriesLoading(false)
      }
    }
    fetchCategories()
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isDropdownOpen])

  const handleCategoryClick = (category: string) => {
    navigate(`/products?category=${encodeURIComponent(category)}`)
    setIsDropdownOpen(false)
    setIsMobileMenuOpen(false)
  }

  return (
    <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-[1400px] mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-12">
          <Link to="/" className="text-2xl font-bold tracking-tighter uppercase">
            Objekt
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium uppercase tracking-widest text-muted-foreground">
            <Link to="/" className="hover:text-foreground transition-colors underline-offset-4 hover:underline">
              Collection
            </Link>
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="hover:text-foreground transition-colors underline-offset-4 hover:underline flex items-center gap-1"
              >
                Categories
                <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {isDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 bg-background border border-border shadow-lg min-w-[200px] z-50">
                  {isCategoriesLoading ? (
                    <div className="p-4 text-xs text-muted-foreground">Loading...</div>
                  ) : categories.length === 0 ? (
                    <div className="p-4 text-xs text-muted-foreground">No categories available</div>
                  ) : (
                    <div className="py-2">
                      {categories.map((category) => (
                        <button
                          key={category}
                          onClick={() => handleCategoryClick(category)}
                          className="w-full text-left px-4 py-2 text-xs hover:bg-secondary transition-colors"
                        >
                          {category}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {isAuthenticated ? (
            <button onClick={signOut} className="p-2 hover:bg-secondary transition-colors rounded-full">
              <User className="w-5 h-5" />
            </button>
          ) : (
            <button onClick={() => setIsAuthOpen(true)} className="p-2 hover:bg-secondary transition-colors rounded-full">
              <User className="w-5 h-5" />
            </button>
          )}
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
      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <div className="px-6 py-4 space-y-4">
            <Link 
              to="/" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="block text-sm font-medium uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
            >
              Collection
            </Link>
            <div>
              <div className="text-sm font-medium uppercase tracking-widest text-muted-foreground mb-2">
                Categories
              </div>
              {isCategoriesLoading ? (
                <div className="text-xs text-muted-foreground">Loading...</div>
              ) : categories.length === 0 ? (
                <div className="text-xs text-muted-foreground">No categories available</div>
              ) : (
                <div className="space-y-1">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => handleCategoryClick(category)}
                      className="block w-full text-left text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
                    >
                      {category}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      <CartSheet
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
      />
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </nav>
  )
}

