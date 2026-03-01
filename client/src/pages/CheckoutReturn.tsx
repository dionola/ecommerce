import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { Button } from '../components/ui/button';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { verifyCheckoutSession } from '../services/orders';

export default function CheckoutReturn() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { refreshCart } = useCart();
    const [status, setStatus] = useState<'loading' | 'success' | 'canceled' | 'error'>('loading');
    const orderId = searchParams.get('order_id');
    const paramStatus = searchParams.get('status');
    const sessionId = searchParams.get('session_id');

    useEffect(() => {
        const verify = async () => {
            if (paramStatus === 'success' && sessionId) {
                try {
                    await verifyCheckoutSession(sessionId);
                    setStatus('success');
                    refreshCart();
                } catch (error) {
                    console.error("Verification failed", error);
                    setStatus('error');
                }
            } else if (paramStatus === 'canceled') {
                setStatus('canceled');
            } else {
                // If no status or session_id, maybe redirect or show error?
                // For now, treat as canceled/error if we landed here without success params
                if (paramStatus === 'success' && !sessionId) {
                    console.warn("Success status but no session ID");
                    setStatus('error');
                } else {
                    setStatus('canceled');
                }
            }
        };

        verify();
    }, [paramStatus, sessionId, refreshCart]);

    return (
        <div className="max-w-md mx-auto px-6 py-24 text-center">
            {status === 'loading' && (
                <div>
                    <Loader2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground animate-spin" />
                    <h1 className="text-2xl font-bold mb-4">Processing...</h1>
                    <p className="text-muted-foreground">Please wait while we confirm your payment.</p>
                </div>
            )}

            {status === 'error' && (
                <div>
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <XCircle className="w-8 h-8 text-red-600" />
                    </div>
                    <h1 className="text-3xl font-bold mb-4">Verification Failed</h1>
                    <p className="text-muted-foreground mb-8">
                        We couldn't verify your payment. Please contact support if you believe this is an error.
                    </p>
                    <div className="space-y-4">
                        <Button onClick={() => navigate('/contact')} className="w-full">
                            Contact Support
                        </Button>
                        <Button onClick={() => navigate('/')} variant="outline" className="w-full">
                            Return Home
                        </Button>
                    </div>
                </div>
            )}

            {status === 'success' && (
                <div>
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <h1 className="text-3xl font-bold mb-4">Payment Successful!</h1>
                    <p className="text-muted-foreground mb-8">
                        Thank you for your purchase. Your order #{orderId} has been confirmed.
                    </p>
                    <div className="space-y-4">
                        <Button onClick={() => navigate('/orders')} className="w-full">
                            View Order
                        </Button>
                        <Button onClick={() => navigate('/')} variant="outline" className="w-full">
                            Continue Shopping
                        </Button>
                    </div>
                </div>
            )}

            {status === 'canceled' && (
                <div>
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <XCircle className="w-8 h-8 text-red-600" />
                    </div>
                    <h1 className="text-3xl font-bold mb-4">Payment Canceled</h1>
                    <p className="text-muted-foreground mb-8">
                        Your payment was canceled. No charges were made.
                    </p>
                    <div className="space-y-4">
                        <Button onClick={() => navigate('/checkout')} className="w-full">
                            Try Again
                        </Button>
                        <Button onClick={() => navigate('/cart')} variant="outline" className="w-full">
                            Return to Cart
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
