import { useEffect, useRef, useState } from 'react';
import { Button } from './ui/button';
import { toast } from './ui/toaster';

// Declare PayRex global type
declare global {
  interface Window {
    PayRex?: (publicKey: string) => any;
  }
}

interface PaymentFormElementsProps {
  clientSecret: string;
  onSuccess: () => void;
  onError: (error: string) => void;
  disabled?: boolean;
}

export function PaymentFormElements({
  clientSecret,
  onSuccess,
  onError,
  disabled = false,
}: PaymentFormElementsProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [payrexLoaded, setPayrexLoaded] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const payrexRef = useRef<any>(null);

  const PAYREX_PUBLIC_KEY = 'pk_test_JmsmYn7iJnjhm36Ha9hua5sQCZ1H14Gz';

  useEffect(() => {
    // Load PayRex Elements via script tag
    const loadPayrex = () => {
      // Check if PayRex is already loaded
      if (window.PayRex) {
        payrexRef.current = window.PayRex(PAYREX_PUBLIC_KEY);
        setPayrexLoaded(true);
        return;
      }

      // Check if script is already being loaded
      if (document.querySelector('script[src*="payrex"]')) {
        // Wait for script to load
        const checkInterval = setInterval(() => {
          if (window.PayRex) {
            clearInterval(checkInterval);
            payrexRef.current = window.PayRex(PAYREX_PUBLIC_KEY);
            setPayrexLoaded(true);
          }
        }, 100);
        return;
      }

      // Load PayRex script
      const script = document.createElement('script');
      script.src = 'https://checkout.payrexhq.com/lib/checkout.js';
      script.async = true;
      script.onload = () => {
        if (window.PayRex) {
          payrexRef.current = window.PayRex(PAYREX_PUBLIC_KEY);
          setPayrexLoaded(true);
        } else {
          onError('Failed to load PayRex. Please refresh the page.');
        }
      };
      script.onerror = () => {
        onError('Failed to load payment form. Please refresh the page.');
      };
      document.head.appendChild(script);
    };

    loadPayrex();
  }, [onError]);

  useEffect(() => {
    // Mount PayRex Elements when loaded
    if (payrexLoaded && payrexRef.current && clientSecret) {
      const elements = payrexRef.current.elements();
      const cardElement = elements.create('card');
      const cardElementContainer = document.getElementById('payrex-card-element');
      
      if (cardElementContainer) {
        // Clear any existing content
        cardElementContainer.innerHTML = '';
        cardElement.mount('#payrex-card-element');
      }

      return () => {
        if (cardElement) {
          cardElement.unmount();
        }
      };
    }
  }, [payrexLoaded, clientSecret]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!payrexRef.current || !clientSecret) {
      onError('Payment form is not ready. Please wait a moment and try again.');
      return;
    }

    setIsProcessing(true);

    try {
      const elements = payrexRef.current.elements();
      
      // Confirm payment with PayRex Elements
      const { error } = await payrexRef.current.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/return`,
        },
      });

      if (error) {
        onError(error.message || 'Payment failed. Please try again.');
        setIsProcessing(false);
      } else {
        // Payment succeeded - will redirect to return_url
        // onSuccess will be called when user returns
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      onError(err.message || 'An error occurred during payment. Please try again.');
      setIsProcessing(false);
    }
  };

  if (!payrexLoaded) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-sm text-muted-foreground">Loading payment form...</div>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
      <div id="payrex-card-element" className="p-4 border border-border rounded-md">
        {/* PayRex Elements will mount here */}
        <div className="text-sm text-muted-foreground">
          Card details will appear here once PayRex Elements is fully loaded.
        </div>
      </div>

      <Button
        type="submit"
        disabled={disabled || isProcessing || !payrexLoaded}
        className="w-full"
      >
        {isProcessing ? 'Processing...' : 'Pay Now'}
      </Button>

      {isProcessing && (
        <p className="text-xs text-center text-muted-foreground">
          Please do not close this window while processing your payment.
        </p>
      )}
    </form>
  );
}

