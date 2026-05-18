import { Link } from "react-router-dom"
import { LayoutDashboard, ShoppingBag } from "lucide-react"

interface MobileMenuProps {
  isAuthenticated: boolean
  isAdmin: boolean
  isSuperAdmin: boolean
  isOpen: boolean
  onClose: () => void
}

export function MobileMenu({ isAuthenticated, isAdmin, isSuperAdmin, isOpen, onClose }: MobileMenuProps) {
  if (!isOpen) return null

  return (
    <div className="md:hidden border-t border-border bg-background">
      <div className="px-6 py-4 space-y-4">
        {isAuthenticated && (
          <div className="border-t border-border pt-4 mt-4">
            <div className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-2">Account</div>
            {(isAdmin || isSuperAdmin) && (
              <Link to="/admin" onClick={onClose} className="flex items-center gap-2 block text-sm text-muted-foreground hover:text-foreground transition-colors py-1">
                <LayoutDashboard className="w-4 h-4" />
                Admin Dashboard
              </Link>
            )}
            <Link to="/orders" onClick={onClose} className="flex items-center gap-2 block text-sm text-muted-foreground hover:text-foreground transition-colors py-1">
              <ShoppingBag className="w-4 h-4" />
              Order History
            </Link>
            <Link to="/wishlist" onClick={onClose} className="block text-sm text-muted-foreground hover:text-foreground transition-colors py-1">
              Wishlist
            </Link>
            <Link to="/settings" onClick={onClose} className="block text-sm text-muted-foreground hover:text-foreground transition-colors py-1">
              Settings
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
