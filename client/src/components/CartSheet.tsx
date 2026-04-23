import { Sheet, SheetContent, SheetHeader, SheetTitle } from "./ui/sheet"
import { Button } from "./ui/button"
import { ScrollArea } from "./ui/scroll-area"
import { X, Minus, Plus, ShoppingBag } from "lucide-react"
import { useCart } from "../contexts/CartContext"
import { useAuth } from "../contexts/AuthContext"
import { useNavigate } from "react-router-dom"
import { mapProductDtoToProduct } from "../types/product"
import { toast, dismissToastsByTitle } from "./ui/toaster"
import type { CartDtoType, GuestCartType } from "../types/cart"
import { useEffect } from "react"
import { formatCurrency } from "../lib/currency"

export function CartSheet({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  const { cart, updateItem, removeItem } = useCart()
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  // Dismiss "Added to cart" toasts when cart sheet opens
  useEffect(() => {
    if (isOpen) {
      dismissToastsByTitle("Added to cart")
    }
  }, [isOpen])

  const handleCheckout = () => {
    if (!isAuthenticated) {
      toast({
        title: "Sign in required",
        description: 'Please sign in to checkout',
        variant: "default",
      })
      return
    }
    onClose()
    navigate('/checkout')
  }

  if (!cart) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent className="w-full sm:max-w-md p-0 flex flex-col border-none rounded-none">
          <SheetHeader className="p-8 border-b border-border">
            <SheetTitle className="text-2xl font-bold uppercase tracking-tighter">Your Bag</SheetTitle>
          </SheetHeader>
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <ShoppingBag className="w-12 h-12 mb-6 text-muted-foreground stroke-1" />
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Your bag is empty</p>
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  const isGuestCart = 'isGuest' in cart && cart.isGuest
  const items = cart.items || []
  
  // Calculate subtotal - for guest cart, calculate from product prices
  const subtotal = isGuestCart
    ? items.reduce((sum, item) => {
        const product = mapProductDtoToProduct(item.product)
        return sum + (product.price * item.quantity)
      }, 0)
    : (cart as CartDtoType).subtotal || 0

  const handleUpdateQuantity = async (itemId: number, delta: number) => {
    // For guest cart, itemId is product_id; for authenticated cart, itemId is item.id
    const item = isGuestCart
      ? items.find(i => i.product_id === itemId)
      : items.find(i => i.id === itemId)
    
    if (!item) return
    
    const newQuantity = Math.max(1, item.quantity + delta)
    try {
      // For guest cart, pass product_id; for authenticated cart, pass item.id
      const identifier = isGuestCart ? item.product_id : item.id
      await updateItem(identifier, newQuantity)
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || 'Failed to update quantity',
        variant: "destructive",
      })
    }
  }

  const handleRemoveItem = async (itemId: number) => {
    try {
      await removeItem(itemId)
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || 'Failed to remove item',
        variant: "destructive",
      })
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col border-none rounded-none">
        <SheetHeader className="p-8 border-b border-border">
          <SheetTitle className="text-2xl font-bold uppercase tracking-tighter">Your Bag</SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <ShoppingBag className="w-12 h-12 mb-6 text-muted-foreground stroke-1" />
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Your bag is empty</p>
            <Button onClick={onClose} variant="link" className="mt-4 text-xs font-bold uppercase tracking-[0.2em]">
              Continue Shopping
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 px-8">
              <div className="py-8 space-y-12">
                {items.map((item) => {
                  const product = mapProductDtoToProduct(item.product)
                  // For guest cart, use product_id as key; for authenticated cart, use item.id
                  const itemKey = isGuestCart ? item.product_id : item.id
                  // For guest cart, use product_id for operations; for authenticated cart, use item.id
                  const itemIdentifier = isGuestCart ? item.product_id : item.id
                  
                  return (
                    <div key={itemKey} className="flex gap-6">
                      <div className="w-24 aspect-[3/4] bg-secondary overflow-hidden">
                        <img
                          src={product.mainImage || "/placeholder.svg"}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 flex flex-col justify-between py-1">
                        <div>
                          <div className="flex justify-between items-start mb-1">
                            <h3 className="text-xs font-bold uppercase tracking-tight">{product.name}</h3>
                            <button
                              onClick={() => handleRemoveItem(itemIdentifier)}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Ref. {product.id}</p>
                        </div>

                        <div className="flex justify-between items-end">
                          <div className="flex items-center gap-4">
                            <button
                              onClick={() => handleUpdateQuantity(itemIdentifier, -1)}
                              className="p-1 hover:bg-secondary transition-colors"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs font-bold">{item.quantity}</span>
                            <button
                              onClick={() => handleUpdateQuantity(itemIdentifier, 1)}
                              className="p-1 hover:bg-secondary transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <p className="text-sm font-bold tracking-tighter">{formatCurrency(product.price * item.quantity)}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>

            <div className="p-8 border-t border-border bg-secondary">
              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  <span>Shipping</span>
                  <span>Calculated at checkout</span>
                </div>
                <div className="border-t border-border pt-4 flex justify-between text-lg font-bold uppercase tracking-tighter">
                  <span>Total</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
              </div>
              <Button 
                onClick={handleCheckout}
                className="w-full h-14 rounded-none bg-black text-white text-xs font-bold uppercase tracking-[0.3em] hover:bg-zinc-800"
              >
                Checkout
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
