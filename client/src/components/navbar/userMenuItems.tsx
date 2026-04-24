import { Building2, Heart, LayoutDashboard, Package, Settings, ShoppingBag, Tag, Users } from "lucide-react"
import { Link } from "react-router-dom"

interface UserMenuItemsProps {
  isAdmin: boolean
  isSuperAdmin: boolean
  onNavigate: () => void
}

export function UserMenuItems({ isAdmin, isSuperAdmin, onNavigate }: UserMenuItemsProps) {
  return (
    <>
      {(isAdmin || isSuperAdmin) && (
        <>
          <Link to="/admin" onClick={onNavigate} className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm hover:bg-secondary transition-colors">
            <LayoutDashboard className="w-4 h-4" />
            Admin Dashboard
          </Link>
          <div className="px-4 py-1 text-xs text-muted-foreground uppercase tracking-wider">Admin</div>
          <Link to="/admin/products" onClick={onNavigate} className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm hover:bg-secondary transition-colors">
            <Package className="w-4 h-4" />
            Products
          </Link>
          <Link to="/admin/orders" onClick={onNavigate} className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm hover:bg-secondary transition-colors">
            <ShoppingBag className="w-4 h-4" />
            Orders
          </Link>
          <Link to="/admin/promos" onClick={onNavigate} className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm hover:bg-secondary transition-colors">
            <Tag className="w-4 h-4" />
            Promos
          </Link>
          <Link to="/admin/manufacturers" onClick={onNavigate} className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm hover:bg-secondary transition-colors">
            <Building2 className="w-4 h-4" />
            Manufacturers
          </Link>
          {(isSuperAdmin || isAdmin) && (
            <Link to="/admin/users" onClick={onNavigate} className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm hover:bg-secondary transition-colors">
              <Users className="w-4 h-4" />
              Users
            </Link>
          )}
          <div className="border-t border-border my-1" />
        </>
      )}

      <Link to="/orders" onClick={onNavigate} className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm hover:bg-secondary transition-colors">
        <ShoppingBag className="w-4 h-4" />
        Order History
      </Link>
      <Link to="/wishlist" onClick={onNavigate} className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm hover:bg-secondary transition-colors">
        <Heart className="w-4 h-4" />
        Wishlist
      </Link>
      <Link to="/settings" onClick={onNavigate} className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm hover:bg-secondary transition-colors">
        <Settings className="w-4 h-4" />
        Settings
      </Link>
    </>
  )
}
