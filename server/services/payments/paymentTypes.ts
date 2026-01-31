/**
 * Payment types and interfaces
 */

export type PaymentProcessorType = "payrex";

export type PaymentMethod = "elements" | "checkout";

export interface PaymentIntentRequest {
  amount: number; // Amount in smallest currency unit (cents for USD)
  currency: string; // e.g., "usd"
  orderId: number;
  metadata?: Record<string, string>;
  paymentMethod?: PaymentMethod;
}

export interface PaymentIntentResponse {
  paymentIntentId: string;
  clientSecret?: string; // For Stripe
  status: "requires_payment_method" | "requires_confirmation" | "requires_action" | "processing" | "succeeded" | "canceled";
  metadata?: Record<string, string>;
}

export interface ConfirmPaymentRequest {
  paymentIntentId: string;
  paymentMethodId?: string; // For Stripe
  metadata?: Record<string, string>;
}

export interface ConfirmPaymentResponse {
  paymentIntentId: string;
  status: "succeeded" | "failed" | "canceled" | "processing";
  transactionId?: string;
  error?: {
    code: string;
    message: string;
  };
}

export interface RefundRequest {
  paymentIntentId: string;
  amount?: number; // Partial refund if specified, full refund if not
  reason?: string;
}

export interface RefundResponse {
  refundId: string;
  amount: number;
  status: "succeeded" | "pending" | "failed";
  paymentIntentId: string;
}










