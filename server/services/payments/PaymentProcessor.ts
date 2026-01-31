/**
 * Payment Processor Interface
 * All payment processors must implement this interface
 */

import {
  PaymentIntentRequest,
  PaymentIntentResponse,
  ConfirmPaymentRequest,
  ConfirmPaymentResponse,
  RefundRequest,
  RefundResponse,
} from "./paymentTypes";

export interface IPaymentProcessor {
  /**
   * Create a payment intent for an order
   */
  createPaymentIntent(request: PaymentIntentRequest): Promise<PaymentIntentResponse>;

  /**
   * Confirm a payment intent
   */
  confirmPayment(request: ConfirmPaymentRequest): Promise<ConfirmPaymentResponse>;

  /**
   * Get payment intent status
   */
  getPaymentIntentStatus(paymentIntentId: string): Promise<PaymentIntentResponse>;

  /**
   * Cancel a payment intent
   */
  cancelPaymentIntent(paymentIntentId: string): Promise<ConfirmPaymentResponse>;

  /**
   * Process a refund
   */
  refund(request: RefundRequest): Promise<RefundResponse>;
}










