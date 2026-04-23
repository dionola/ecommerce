/**
 * Payment Service Facade
 * Routes payment operations to the appropriate processor
 */

import { IPaymentProcessor } from "./PaymentProcessor.js";
import { StripeProcessor } from "./stripe/StripeProcessor.js";
import {
  PaymentProcessorType,
} from "./paymentTypes.js";
import { logger } from "../../utils/logger.js";

class PaymentService {
  private processors: Map<PaymentProcessorType, IPaymentProcessor> = new Map();
  private defaultProcessor: PaymentProcessorType = "stripe";

  constructor() {
    this.initializeAvailableProcessors();

    logger.info("PaymentService initialized", {
      availableProcessors: Array.from(this.processors.keys()),
      defaultProcessor: this.defaultProcessor,
    });
  }

  private initializeAvailableProcessors(): void {
    const secretKey = process.env.STRIPE_SECRET_KEY;

    if (!secretKey) {
      logger.warn("Stripe processor disabled: STRIPE_SECRET_KEY is not configured");
      return;
    }

    try {
      this.processors.set("stripe", new StripeProcessor());
    } catch (error) {
      logger.error("Failed to initialize Stripe processor", error);
    }
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
   * Get processor instance by type (public method for accessing specific processor implementations)
   */
  getProcessorInstance(type?: PaymentProcessorType): IPaymentProcessor {
    return this.getProcessor(type);
  }

  /**
   * Get available processors
   */
  getAvailableProcessors(): PaymentProcessorType[] {
    return Array.from(this.processors.keys());
  }

  hasProcessor(type: PaymentProcessorType): boolean {
    return this.processors.has(type);
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









