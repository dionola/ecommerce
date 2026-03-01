/**
 * Payment Service Facade
 * Routes payment operations to the appropriate processor
 */

import { IPaymentProcessor } from "./PaymentProcessor";
import { StripeProcessor } from "./stripe/StripeProcessor";
import {
  PaymentProcessorType,
} from "./paymentTypes";
import { logger } from "../../utils/logger";

class PaymentService {
  private processors: Map<PaymentProcessorType, IPaymentProcessor> = new Map();
  private defaultProcessor: PaymentProcessorType = "stripe";

  constructor() {
    // Initialize processors
    this.processors.set("stripe", new StripeProcessor());

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










