/**
 * Payment Service Facade
 * Routes payment operations to the appropriate processor
 */

import { IPaymentProcessor } from "./PaymentProcessor";
import { StripeProcessor } from "./stripe/StripeProcessor";
import {
  PaymentProcessorType,
  PaymentIntentRequest,
  PaymentIntentResponse,
  ConfirmPaymentRequest,
  ConfirmPaymentResponse,
  RefundRequest,
  RefundResponse,
} from "./paymentTypes";
import { logger } from "../../utils/logger";

class PaymentService {
  private processors: Map<PaymentProcessorType, IPaymentProcessor> = new Map();
  private defaultProcessor: PaymentProcessorType = "stripe";

  constructor() {
    // Initialize processors
    this.processors.set("stripe", new StripeProcessor());
    
    // TODO: Add local processors when implemented
    // this.processors.set("local1", new Local1Processor());
    // this.processors.set("local2", new Local2Processor());
    
    logger.info("PaymentService initialized", {
      availableProcessors: Array.from(this.processors.keys()),
      defaultProcessor: this.defaultProcessor,
    });
  }

  /**
   * Get a payment processor by type
   */
  private getProcessor(type?: PaymentProcessorType): IPaymentProcessor {
    const processorType = type || this.defaultProcessor;
    const processor = this.processors.get(processorType);

    if (!processor) {
      throw new Error(`Payment processor '${processorType}' not found`);
    }

    return processor;
  }

  /**
   * Create a payment intent
   */
  async createPaymentIntent(
    request: PaymentIntentRequest,
    processorType?: PaymentProcessorType
  ): Promise<PaymentIntentResponse> {
    const processor = this.getProcessor(processorType);
    logger.info("Creating payment intent", {
      orderId: request.orderId,
      amount: request.amount,
      processor: processorType || this.defaultProcessor,
    });
    
    return processor.createPaymentIntent(request);
  }

  /**
   * Confirm a payment
   */
  async confirmPayment(
    request: ConfirmPaymentRequest,
    processorType?: PaymentProcessorType
  ): Promise<ConfirmPaymentResponse> {
    const processor = this.getProcessor(processorType);
    logger.info("Confirming payment", {
      paymentIntentId: request.paymentIntentId,
      processor: processorType || this.defaultProcessor,
    });
    
    return processor.confirmPayment(request);
  }

  /**
   * Get payment intent status
   */
  async getPaymentIntentStatus(
    paymentIntentId: string,
    processorType?: PaymentProcessorType
  ): Promise<PaymentIntentResponse> {
    const processor = this.getProcessor(processorType);
    return processor.getPaymentIntentStatus(paymentIntentId);
  }

  /**
   * Cancel a payment intent
   */
  async cancelPaymentIntent(
    paymentIntentId: string,
    processorType?: PaymentProcessorType
  ): Promise<ConfirmPaymentResponse> {
    const processor = this.getProcessor(processorType);
    logger.info("Canceling payment intent", {
      paymentIntentId,
      processor: processorType || this.defaultProcessor,
    });
    
    return processor.cancelPaymentIntent(paymentIntentId);
  }

  /**
   * Process a refund
   */
  async refund(
    request: RefundRequest,
    processorType?: PaymentProcessorType
  ): Promise<RefundResponse> {
    const processor = this.getProcessor(processorType);
    logger.info("Processing refund", {
      paymentIntentId: request.paymentIntentId,
      amount: request.amount,
      processor: processorType || this.defaultProcessor,
    });
    
    return processor.refund(request);
  }

  /**
   * Get available processors
   */
  getAvailableProcessors(): PaymentProcessorType[] {
    return Array.from(this.processors.keys());
  }

  /**
   * Set default processor
   */
  setDefaultProcessor(type: PaymentProcessorType): void {
    if (!this.processors.has(type)) {
      throw new Error(`Payment processor '${type}' not available`);
    }
    this.defaultProcessor = type;
    logger.info("Default payment processor changed", { processor: type });
  }
}

// Export singleton instance
export const paymentService = new PaymentService();



