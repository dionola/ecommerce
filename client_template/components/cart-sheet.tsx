"use client"

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { X, Minus, Plus, ShoppingBag } from "lucide-react"

interface CartItem {
  id: number
  name: string
  price: number
  image: string
  quantity: number
}

export function CartSheet({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
}: {
  isOpen: boolean
  onClose: () => void
  items: CartItem[]
  onUpdateQuantity: (id: number, delta: number) => void
  onRemoveItem: (id: number) => void
}) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col border-none rounded-none">
        <SheetHeader className="p-8 border-b border-border">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-2xl font-bold uppercase tracking-tighter">Your Bag</SheetTitle>
            <button onClick={onClose} className="p-2 hover:bg-secondary transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
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
                {items.map((item) => (
                  <div key={item.id} className="flex gap-6">
                    <div className="w-24 aspect-[3/4] bg-secondary overflow-hidden">
                      <img
                        src={item.image || "/placeholder.svg"}
                        alt={item.name}
                        className="w-full h-full object-cover grayscale"
                      />
                    </div>
                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div>
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="text-xs font-bold uppercase tracking-tight">{item.name}</h3>
                          <button
                            onClick={() => onRemoveItem(item.id)}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Ref. {item.id}</p>
                      </div>

                      <div className="flex justify-between items-end">
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => onUpdateQuantity(item.id, -1)}
                            className="p-1 hover:bg-secondary transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-bold">{item.quantity}</span>
                          <button
                            onClick={() => onUpdateQuantity(item.id, 1)}
                            className="p-1 hover:bg-secondary transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <p className="text-sm font-bold tracking-tighter">${item.price * item.quantity}.00</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="p-8 border-t border-border bg-secondary">
              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                  <span>Subtotal</span>
                  <span>${subtotal}.00</span>
                </div>
                <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  <span>Shipping</span>
                  <span>Calculated at checkout</span>
                </div>
                <div className="border-t border-border pt-4 flex justify-between text-lg font-bold uppercase tracking-tighter">
                  <span>Total</span>
                  <span>${subtotal}.00</span>
                </div>
              </div>
              <Button className="w-full h-14 rounded-none bg-black text-white text-xs font-bold uppercase tracking-[0.3em] hover:bg-zinc-800">
                Checkout
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
