import { Link } from "react-router-dom"
import { ShoppingCart, Menu, User, X, LayoutDashboard, ShoppingBag, Heart, Settings, Package, Tag, Building2, Users, HelpCircle, Info, Mail, Truck, RotateCcw } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { CartSheet } from "./CartSheet"
import { AuthModal } from "./AuthModal"
import { useCart } from "../contexts/CartContext"
import { useAuth } from "../contexts/AuthContext"

export function Navbar() {
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { cartCount } = useCart()
  const { isAuthenticated, user, signOut } = useAuth()
  const userDropdownRef = useRef<HTMLDivElement>(null)

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
            Objekt
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium uppercase tracking-widest text-muted-foreground">
            <Link to="/" className="hover:text-foreground transition-colors underline-offset-4 hover:underline">
              Collection
            </Link>
            <Link to="/about" className="hover:text-foreground transition-colors underline-offset-4 hover:underline">
              About
            </Link>
            <Link to="/shipping" className="hover:text-foreground transition-colors underline-offset-4 hover:underline">
              Shipping
            </Link>
            <Link to="/returns" className="hover:text-foreground transition-colors underline-offset-4 hover:underline">
              Returns
            </Link>
            <Link to="/contact" className="hover:text-foreground transition-colors underline-offset-4 hover:underline">
              Contact
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {isAuthenticated ? (
            <div className="relative" ref={userDropdownRef}>
              <button 
                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)} 
                className="p-2 hover:bg-secondary transition-colors rounded-full"
              >
                <User className="w-5 h-5" />
              </button>
              {isUserDropdownOpen && (
                <div className="absolute top-full right-0 mt-2 bg-background border border-border shadow-lg min-w-[240px] z-50 rounded-md">
                  <div className="py-2">
                    {user && (
                      <div className="px-4 py-2 border-b border-border">
                        <div className="text-sm font-medium">{user.email}</div>
                        {user.groups && user.groups.length > 0 && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {user.groups.join(', ')}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Admin Menu Items */}
                    {(user?.groups?.includes('admin') || user?.groups?.includes('superadmin')) && (
                      <>
                        <Link
                          to="/admin"
                          onClick={() => setIsUserDropdownOpen(false)}
                          className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm hover:bg-secondary transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4" />
                          Admin Dashboard
                        </Link>
                        <div className="px-4 py-1 text-xs text-muted-foreground uppercase tracking-wider">
                          Admin
                        </div>
                        <Link
                          to="/admin/products"
                          onClick={() => setIsUserDropdownOpen(false)}
                          className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm hover:bg-secondary transition-colors"
                        >
                          <Package className="w-4 h-4" />
                          Products
                        </Link>
                        <Link
                          to="/admin/orders"
                          onClick={() => setIsUserDropdownOpen(false)}
                          className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm hover:bg-secondary transition-colors"
                        >
                          <ShoppingBag className="w-4 h-4" />
                          Orders
                        </Link>
                        <Link
                          to="/admin/promos"
                          onClick={() => setIsUserDropdownOpen(false)}
                          className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm hover:bg-secondary transition-colors"
                        >
                          <Tag className="w-4 h-4" />
                          Promos
                        </Link>
                        <Link
                          to="/admin/manufacturers"
                          onClick={() => setIsUserDropdownOpen(false)}
                          className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm hover:bg-secondary transition-colors"
                        >
                          <Building2 className="w-4 h-4" />
                          Manufacturers
                        </Link>
                        {(user?.groups?.includes('superadmin') || user?.groups?.includes('admin')) && (
                          <Link
                            to="/admin/users"
                            onClick={() => setIsUserDropdownOpen(false)}
                            className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm hover:bg-secondary transition-colors"
                          >
                            <Users className="w-4 h-4" />
                            Users
                          </Link>
                        )}
                        <div className="border-t border-border my-1"></div>
                      </>
                    )}
                    
                    {/* Regular User Menu Items */}
                    <Link
                      to="/orders"
                      onClick={() => setIsUserDropdownOpen(false)}
                      className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm hover:bg-secondary transition-colors"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      Order History
                    </Link>
                    <Link
                      to="/wishlist"
                      onClick={() => setIsUserDropdownOpen(false)}
                      className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm hover:bg-secondary transition-colors"
                    >
                      <Heart className="w-4 h-4" />
                      Wishlist
                    </Link>
                    <Link
                      to="/settings"
                      onClick={() => setIsUserDropdownOpen(false)}
                      className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm hover:bg-secondary transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      Settings
                    </Link>
                    <div className="border-t border-border my-1"></div>
                    <button
                      onClick={async () => {
                        await signOut()
                        setIsUserDropdownOpen(false)
                      }}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-secondary transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
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
            <Link 
              to="/about" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="block text-sm font-medium uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
            >
              About
            </Link>
            <Link 
              to="/shipping" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="block text-sm font-medium uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
            >
              Shipping
            </Link>
            <Link 
              to="/returns" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="block text-sm font-medium uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
            >
              Returns
            </Link>
            <Link 
              to="/contact" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="block text-sm font-medium uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
            >
              Contact
            </Link>
            {isAuthenticated && (
              <>
                <div className="border-t border-border pt-4 mt-4">
                  <div className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-2">
                    Account
                  </div>
                  {(user?.groups?.includes('admin') || user?.groups?.includes('superadmin')) && (
                    <>
                      <Link
                        to="/admin"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-2 block text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        Admin Dashboard
                      </Link>
                    </>
                  )}
                  <Link
                    to="/orders"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2 block text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    Order History
                  </Link>
                  <Link
                    to="/wishlist"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2 block text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
                  >
                    <Heart className="w-4 h-4" />
                    Wishlist
                  </Link>
                  <Link
                    to="/settings"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2 block text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </Link>
                </div>
              </>
            )}
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

