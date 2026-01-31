import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { createOrder, createCheckoutSession } from '../services/orders';
import { validatePromoCode, calculateDiscount, type Promo } from '../services/promos';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { ShoppingBag, ArrowLeft, Info } from 'lucide-react';
import { mapProductDtoToProduct } from '../types/product';
import { toast } from '../components/ui/toaster';
import { PaymentFormElements } from '../components/PaymentFormElements';
import { api } from '../services/api';

type PaymentMethod = 'elements' | 'checkout';

export default function Checkout() {
  const navigate = useNavigate();
  const { cart, refreshCart } = useCart();
  const { isAuthenticated } = useAuth();
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{ promo: Promo; discount: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('elements');
  const [orderId, setOrderId] = useState<number | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (isAuthenticated) {
      refreshCart();
    }
  }, [isAuthenticated, refreshCart]);

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

  const subtotal = ('subtotal' in cart && cart.subtotal) ? cart.subtotal :
    cart.items.reduce((sum, item) => {
      const product = mapProductDtoToProduct(item.product);
      return sum + product.price * item.quantity;
    }, 0);

  // Calculate discount and total based on validated promo
  const discount = appliedPromo?.discount || 0;
  const total = subtotal - discount;
  const requiresPayment = total > 0;

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;

    try {
      // Validate promo code with backend
      const promo = await validatePromoCode(promoCode.toUpperCase());

      // Calculate discount based on promo type
      const promoDiscount = calculateDiscount(promo, subtotal);

      // Ensure discount doesn't exceed subtotal
      const finalDiscount = Math.min(promoDiscount, subtotal);

      setAppliedPromo({ promo, discount: finalDiscount });
      toast({
        title: "Promo code applied",
        description: `Promo code ${promo.code} has been applied`,
        variant: "success",
      })
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to apply promo code';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
      setAppliedPromo(null);
    }
  };

  const handleCreateOrder = async () => {
    setLoading(true);

    try {
      // Refresh cart from server to ensure we have the latest data
      await refreshCart();

      // Wait a brief moment for state to update after refresh
      await new Promise(resolve => setTimeout(resolve, 200));

      // Validate cart has items before attempting order creation
      // Note: Server will also validate, but this gives better UX
      if (!cart || cart.items.length === 0) {
        toast({
          title: "Empty Cart",
          description: "Your cart is empty. Please add items before checkout.",
          variant: "destructive",
        });
        setLoading(false);
        navigate('/');
        return;
      }

      // Create order first (without payment intent - we'll create it separately)
      // The server will validate that the cart has items
      const order = await createOrder({
        shipping_address: {}, // Empty object since shipping is not used
        promo_code: promoCode || undefined,
        create_payment_intent: false, // Don't create payment intent during order creation
        payment_processor: 'payrex',
        payment_method: requiresPayment ? paymentMethod : undefined,
      });

      setOrderId(order.id);

      // If payment is required, create payment intent or checkout session
      if (requiresPayment) {
        if (paymentMethod === 'elements') {
          // Create payment intent for Elements
          try {
            const response = await api.post<{ clientSecret: string; paymentIntentId: string }>('/payments/intents', {
              order_id: order.id,
              processor: 'payrex',
            });

            if (!response.data.clientSecret) {
              throw new Error('No client secret returned from payment intent');
            }

            setClientSecret(response.data.clientSecret);
            setLoading(false); // Payment form will appear
          } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to create payment intent';
            toast({
              title: "Error",
              description: errorMessage,
              variant: "destructive",
            });
            setLoading(false);
          }
        } else {
          // Create checkout session for Checkout
          try {
            const successUrl = `${window.location.origin}/checkout/return?order_id=${order.id}&status=success`;
            const cancelUrl = `${window.location.origin}/checkout?order_id=${order.id}&status=canceled`;
            const session = await createCheckoutSession(order.id, successUrl, cancelUrl);

            if (!session.checkoutUrl) {
              throw new Error('No checkout URL returned from server');
            }

            // Redirect to PayRex Checkout
            window.location.href = session.checkoutUrl;
            return; // Don't set loading to false, we're redirecting
          } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to create checkout session';
            toast({
              title: "Error",
              description: errorMessage,
              variant: "destructive",
            });
            setLoading(false);
          }
        }
      } else {
        // No payment required, order is complete
        toast({
          title: "Order placed",
          description: "Your order has been placed successfully",
          variant: "success",
        });
        await refreshCart();
        setTimeout(() => {
          navigate('/orders');
        }, 1500);
        setLoading(false);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create order';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async () => {
    toast({
      title: "Payment successful",
      description: "Your order has been placed successfully",
      variant: "success",
    });
    await refreshCart();
    setTimeout(() => {
      navigate('/orders');
    }, 1500);
  };

  const handlePaymentError = (error: string) => {
    toast({
      title: "Payment failed",
      description: error,
      variant: "destructive",
    });
    setClientSecret(null);
    setOrderId(null);
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
            {/* Left: Payment Method & Payment Form */}
            <div>
              <h1 className="text-4xl font-bold uppercase tracking-tighter mb-8">Checkout</h1>

              <form onSubmit={(e) => { e.preventDefault(); handleCreateOrder(); }} className="space-y-8">
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
                      placeholder="Enter promo code"
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
                    <p className="text-xs text-green-600 mt-2">Promo code {appliedPromo.promo.code} applied</p>
                  )}
                </div>

                {/* Payment Method Selection */}
                {requiresPayment && (
                  <div>
                    <h2 className="text-xl font-semibold mb-4 uppercase tracking-tight">Payment Method</h2>

                    {/* Portfolio Demonstration Note */}
                    <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                      <div className="flex items-start gap-2">
                        <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-blue-800">
                          <strong>Note:</strong> This is a portfolio demonstration showing two different PayRex integration approaches. Both methods are functionally equivalent - this is merely an implementation difference.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="flex items-center gap-3 p-4 border border-border rounded-md cursor-pointer hover:bg-accent transition-colors">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="elements"
                          checked={paymentMethod === 'elements'}
                          onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                          className="w-4 h-4"
                        />
                        <div className="flex-1">
                          <div className="font-semibold text-sm">PayRex Elements (Web)</div>
                          <div className="text-xs text-muted-foreground">Embedded payment form in your app</div>
                        </div>
                      </label>
                      <label className="flex items-center gap-3 p-4 border border-border rounded-md cursor-pointer hover:bg-accent transition-colors">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="checkout"
                          checked={paymentMethod === 'checkout'}
                          onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                          className="w-4 h-4"
                        />
                        <div className="flex-1">
                          <div className="font-semibold text-sm">PayRex Checkout (Backend)</div>
                          <div className="text-xs text-muted-foreground">Redirect to PayRex hosted payment page</div>
                        </div>
                      </label>
                    </div>
                  </div>
                )}

                {/* Payment Form (Elements) - Shows after order is created and payment intent is ready */}
                {requiresPayment && paymentMethod === 'elements' && clientSecret && (
                  <div>
                    <h2 className="text-xl font-semibold mb-4 uppercase tracking-tight">Payment Details</h2>
                    <PaymentFormElements
                      clientSecret={clientSecret}
                      onSuccess={handlePaymentSuccess}
                      onError={handlePaymentError}
                      disabled={loading}
                    />
                  </div>
                )}

                {/* Place Order / Continue to Payment Button */}
                {/* Show button if: no payment required, OR Elements method without clientSecret, OR Checkout method */}
                {(!requiresPayment ||
                  (paymentMethod === 'elements' && !clientSecret) ||
                  (paymentMethod === 'checkout')) && (
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full h-14 rounded-none bg-black text-white text-xs font-bold uppercase tracking-[0.3em] hover:bg-zinc-800"
                    >
                      {loading
                        ? 'Processing...'
                        : requiresPayment && paymentMethod === 'checkout'
                          ? 'Continue to Payment'
                          : requiresPayment && paymentMethod === 'elements' && orderId && !clientSecret
                            ? 'Continue to Payment'
                            : 'Place Order'
                      }
                    </Button>
                  )}
              </form>
            </div>

            {/* Right: Order Summary */}
            <div className="flex flex-col h-full">
              <h2 className="text-2xl font-bold uppercase tracking-tighter mb-8">Order Summary</h2>

              <div className="space-y-6 mb-8 overflow-y-auto flex-1 scrollbar-hide" style={{ maxHeight: 'calc(100vh - 400px)' }}>
                {cart.items.map((item, index) => {
                  const product = mapProductDtoToProduct(item.product);
                  return (
                    <div key={'id' in item ? item.id : index} className="flex gap-4">
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
                {appliedPromo && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Discount ({appliedPromo.promo.code})
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
