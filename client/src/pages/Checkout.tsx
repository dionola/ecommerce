import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { createOrder } from '../services/orders';
import { getSettings } from '../services/settings';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { ShoppingBag, ArrowLeft } from 'lucide-react';
import { mapProductDtoToProduct } from '../types/product';
import { toast } from '../components/ui/toaster';

export default function Checkout() {
  const navigate = useNavigate();
  const { cart, refreshCart } = useCart();
  const { isAuthenticated } = useAuth();
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discount: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [shippingAddress, setShippingAddress] = useState({
    street: '',
    city: '',
    state: '',
    zip: '',
    country: 'USA',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }

    // Load saved shipping address from settings
    const settings = getSettings();
    if (settings.shipping_address) {
      setShippingAddress({
        street: settings.shipping_address.street || '',
        city: settings.shipping_address.city || '',
        state: settings.shipping_address.state || '',
        zip: settings.shipping_address.zip || '',
        country: settings.shipping_address.country || 'USA',
      });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  if (!isAuthenticated) {
    return null;
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 pt-20">
          <div className="max-w-[1400px] mx-auto px-6 py-12">
            <div className="text-center">
              <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
              <Button onClick={() => navigate('/')}>Continue Shopping</Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const subtotal = cart.subtotal || 0;
  
  // Check if test promo code is used
  const isTestPromo = promoCode && promoCode.toUpperCase().startsWith('TEST');
  
  // Calculate discount and total
  // For test promo codes, set discount to full subtotal (total becomes 0)
  const discount = isTestPromo ? subtotal : (appliedPromo?.discount || 0);
  const total = subtotal - discount;

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;

    try {
      // Check if it's a test promo code
      const isTest = promoCode.toUpperCase().startsWith('TEST');
      
      // For test promo codes, set discount to full subtotal
      const promoDiscount = isTest ? subtotal : 0;
      
      setAppliedPromo({ code: promoCode.toUpperCase(), discount: promoDiscount });
      toast({
        title: "Promo code applied",
        description: isTest 
          ? `Test promo code ${promoCode.toUpperCase()} applied - order will be $0.00`
          : `Promo code ${promoCode.toUpperCase()} has been applied`,
        variant: "success",
      })
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || 'Failed to apply promo code',
        variant: "destructive",
      })
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Check if test promo code is used
      const isTestPromo = promoCode && promoCode.toUpperCase().startsWith('TEST');
      
      await createOrder({
        shipping_address: shippingAddress,
        promo_code: promoCode || undefined,
        create_payment_intent: !isTestPromo && total > 0, // Skip payment for test promos or $0 orders
      });

      toast({
        title: "Order placed",
        description: isTestPromo 
          ? "Test order placed successfully (no payment required)" 
          : "Your order has been placed successfully",
        variant: "success",
      })

      // Clear cart and redirect to orders
      await refreshCart();
      setTimeout(() => {
        navigate('/orders');
      }, 1500);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || 'Failed to place order',
        variant: "destructive",
      })
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-20">
        <div className="max-w-[1400px] mx-auto px-6 py-12">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] mb-12 hover:opacity-50 transition-opacity"
          >
            <ArrowLeft className="w-3 h-3" />
            Back
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Left: Shipping Address & Promo Code */}
            <div>
              <h1 className="text-4xl font-bold uppercase tracking-tighter mb-8">Checkout</h1>

              <form onSubmit={handlePlaceOrder} className="space-y-8">
                {/* Promo Code */}
                <div>
                  <Label htmlFor="promo" className="text-xs font-bold uppercase tracking-widest mb-2 block">
                    Promo Code
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="promo"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                      placeholder="TESTDELIVERED, TESTCOMPLETED, etc."
                      className="rounded-none border-border h-12 text-xs font-bold tracking-widest uppercase"
                    />
                    <Button
                      type="button"
                      onClick={handleApplyPromo}
                      variant="outline"
                      className="rounded-none h-12 px-6"
                    >
                      Apply
                    </Button>
                  </div>
                  {appliedPromo && (
                    <p className="text-xs text-green-600 mt-2">Promo code {appliedPromo.code} applied</p>
                  )}
                </div>

                {/* Shipping Address */}
                <div>
                  <h2 className="text-xl font-semibold mb-4 uppercase tracking-tight">Shipping Address</h2>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="street" className="text-xs font-bold uppercase tracking-widest mb-2 block">
                        Street Address
                      </Label>
                      <Input
                        id="street"
                        value={shippingAddress.street}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, street: e.target.value })}
                        required
                        className="rounded-none border-border h-12"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="city" className="text-xs font-bold uppercase tracking-widest mb-2 block">
                          City
                        </Label>
                        <Input
                          id="city"
                          value={shippingAddress.city}
                          onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                          required
                          className="rounded-none border-border h-12"
                        />
                      </div>
                      <div>
                        <Label htmlFor="state" className="text-xs font-bold uppercase tracking-widest mb-2 block">
                          State
                        </Label>
                        <Input
                          id="state"
                          value={shippingAddress.state}
                          onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                          required
                          className="rounded-none border-border h-12"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="zip" className="text-xs font-bold uppercase tracking-widest mb-2 block">
                          ZIP Code
                        </Label>
                        <Input
                          id="zip"
                          value={shippingAddress.zip}
                          onChange={(e) => setShippingAddress({ ...shippingAddress, zip: e.target.value })}
                          required
                          className="rounded-none border-border h-12"
                        />
                      </div>
                      <div>
                        <Label htmlFor="country" className="text-xs font-bold uppercase tracking-widest mb-2 block">
                          Country
                        </Label>
                        <Input
                          id="country"
                          value={shippingAddress.country}
                          onChange={(e) => setShippingAddress({ ...shippingAddress, country: e.target.value })}
                          required
                          className="rounded-none border-border h-12"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-14 rounded-none bg-black text-white text-xs font-bold uppercase tracking-[0.3em] hover:bg-zinc-800"
                >
                  {loading ? 'Placing Order...' : 'Place Order'}
                </Button>
              </form>
            </div>

            {/* Right: Order Summary */}
            <div>
              <h2 className="text-2xl font-bold uppercase tracking-tighter mb-8">Order Summary</h2>

              <div className="space-y-6 mb-8">
                {cart.items.map((item) => {
                  const product = mapProductDtoToProduct(item.product);
                  return (
                    <div key={item.id} className="flex gap-4">
                      <div className="w-24 aspect-[3/4] bg-secondary overflow-hidden">
                        <img
                          src={product.mainImage || "/placeholder.svg"}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold mb-1">{product.name}</h3>
                        <p className="text-xs text-muted-foreground mb-2">
                          Quantity: {item.quantity} × ${product.price.toFixed(2)}
                        </p>
                        <p className="text-sm font-bold">${(product.price * item.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-border pt-6 space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-semibold">${subtotal.toFixed(2)}</span>
                </div>
                {(appliedPromo || isTestPromo) && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {isTestPromo ? `Test Promo (${promoCode.toUpperCase()})` : `Discount (${appliedPromo?.code})`}
                    </span>
                    <span className="font-semibold text-green-600">-${discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold border-t border-border pt-4">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

