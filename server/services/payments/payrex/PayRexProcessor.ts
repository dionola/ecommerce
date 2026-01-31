/**
 * PayRex Payment Processor Implementation
 * Supports both Elements (frontend) and Checkout (backend) payment methods
 */

import axios, { AxiosInstance } from "axios";
import { IPaymentProcessor } from "../PaymentProcessor";
import {
  PaymentIntentRequest,
  PaymentIntentResponse,
  ConfirmPaymentRequest,
  ConfirmPaymentResponse,
  RefundRequest,
  RefundResponse,
} from "../paymentTypes";
import { logger } from "../../../utils/logger";

interface PayRexPaymentIntent {
  id: string;
  client_secret: string;
  status: string;
  amount: number;
  currency: string;
  metadata?: Record<string, string>;
}

interface PayRexCheckoutSession {
  id: string;
  url: string;
  payment_intent?: string;
  status: string;
}

interface PayRexRefund {
  id: string;
  amount: number;
  status: string;
  payment_intent: string;
}

class PayRexClient {
  private client: AxiosInstance;
  private baseURL = "https://api.payrexhq.com/v1";

  constructor(secretKey: string) {
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
    });
  }

  /**
   * Create a payment intent for Elements integration
   */
  async createPaymentIntent(params: {
    amount: number;
    currency: string;
    metadata?: Record<string, string>;
    payment_methods?: string[];
  }): Promise<PayRexPaymentIntent> {
    try {
      const requestData = {
        amount: params.amount,
        currency: params.currency,
        metadata: params.metadata || {},
        payment_methods: params.payment_methods || ["card"],
      };
      
      logger.info("PayRex: Creating payment intent", {
        url: `${this.baseURL}/payment_intents`,
        data: requestData,
      });

      const response = await this.client.post<PayRexPaymentIntent>("/payment_intents", requestData);

      return response.data;
    } catch (error: any) {
      logger.error("PayRex: Failed to create payment intent", {
        error: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        responseData: error.response?.data,
        requestUrl: error.config?.url,
        requestMethod: error.config?.method,
        requestData: error.config?.data,
      });
      
      // Try alternative endpoint format if 404
      if (error.response?.status === 404) {
        logger.warn("PayRex: 404 error, trying alternative endpoint format");
        try {
          const response = await this.client.post<PayRexPaymentIntent>("/payment-intents", {
            amount: params.amount,
            currency: params.currency,
            metadata: params.metadata || {},
            payment_methods: params.payment_methods || ["card"],
          });
          return response.data;
        } catch (retryError: any) {
          logger.error("PayRex: Alternative endpoint also failed", {
            error: retryError.message,
            responseData: retryError.response?.data,
          });
        }
      }
      
      throw new Error(
        `Failed to create payment intent: ${error.response?.data?.message || error.message}`
      );
    }
  }

  /**
   * Create a checkout session for Checkout integration
   */
  async createCheckoutSession(params: {
    amount: number;
    currency: string;
    success_url: string;
    cancel_url: string;
    metadata?: Record<string, string>;
    payment_methods?: string[];
  }): Promise<PayRexCheckoutSession> {
    try {
      const response = await this.client.post<PayRexCheckoutSession>("/checkout_sessions", {
        amount: params.amount,
        currency: params.currency,
        success_url: params.success_url,
        cancel_url: params.cancel_url,
        metadata: params.metadata || {},
        payment_methods: params.payment_methods || ["card"],
      });

      return response.data;
    } catch (error: any) {
      logger.error("PayRex: Failed to create checkout session", {
        error: error.response?.data || error.message,
      });
      throw new Error(
        `Failed to create checkout session: ${error.response?.data?.message || error.message}`
      );
    }
  }

  /**
   * Confirm a payment intent
   */
  async confirmPaymentIntent(
    id: string,
    paymentMethodId?: string
  ): Promise<{ id: string; status: string }> {
    try {
      const response = await this.client.post<PayRexPaymentIntent>(
        `/payment_intents/${id}/confirm`,
        paymentMethodId ? { payment_method: paymentMethodId } : {}
      );

      return {
        id: response.data.id,
        status: response.data.status,
      };
    } catch (error: any) {
      logger.error("PayRex: Failed to confirm payment intent", {
        id,
        error: error.response?.data || error.message,
      });
      throw new Error(
        `Failed to confirm payment intent: ${error.response?.data?.message || error.message}`
      );
    }
  }

  /**
   * Retrieve a payment intent
   */
  async retrievePaymentIntent(id: string): Promise<PayRexPaymentIntent> {
    try {
      const response = await this.client.get<PayRexPaymentIntent>(`/payment_intents/${id}`);
      return response.data;
    } catch (error: any) {
      logger.error("PayRex: Failed to retrieve payment intent", {
        id,
        error: error.response?.data || error.message,
      });
      throw new Error(
        `Failed to retrieve payment intent: ${error.response?.data?.message || error.message}`
      );
    }
  }

  /**
   * Cancel a payment intent
   */
  async cancelPaymentIntent(id: string): Promise<{ id: string; status: string }> {
    try {
      const response = await this.client.post<PayRexPaymentIntent>(`/payment_intents/${id}/cancel`);
      return {
        id: response.data.id,
        status: response.data.status,
      };
    } catch (error: any) {
      logger.error("PayRex: Failed to cancel payment intent", {
        id,
        error: error.response?.data || error.message,
      });
      throw new Error(
        `Failed to cancel payment intent: ${error.response?.data?.message || error.message}`
      );
    }
  }

  /**
   * Create a refund
   */
  async createRefund(params: {
    payment_intent: string;
    amount?: number;
    reason?: string;
  }): Promise<PayRexRefund> {
    try {
      const response = await this.client.post<PayRexRefund>("/refunds", {
        payment_intent: params.payment_intent,
        amount: params.amount,
        reason: params.reason || "requested_by_customer",
      });

      return response.data;
    } catch (error: any) {
      logger.error("PayRex: Failed to create refund", {
        error: error.response?.data || error.message,
      });
      throw new Error(
        `Failed to create refund: ${error.response?.data?.message || error.message}`
      );
    }
  }
}

export class PayRexProcessor implements IPaymentProcessor {
  private payrex: PayRexClient;

  constructor() {
    const secretKey = process.env.PAYREX_SECRET_KEY || "sk_test_Qth9LZwqGVQeck5NqzQZgnnos3rZdbJa";
    
    if (!secretKey) {
      throw new Error("PAYREX_SECRET_KEY environment variable is required");
    }

    this.payrex = new PayRexClient(secretKey);
    logger.info("PayRexProcessor initialized", {
      baseURL: "https://api.payrexhq.com/v1",
    });
  }

  async createPaymentIntent(request: PaymentIntentRequest): Promise<PaymentIntentResponse> {
    try {
      const result = await this.payrex.createPaymentIntent({
        amount: request.amount,
        currency: request.currency,
        metadata: {
          order_id: request.orderId.toString(),
          ...request.metadata,
        },
        payment_methods: ["card"],
      });

      // Map PayRex status to our standard status
      const statusMap: Record<string, PaymentIntentResponse["status"]> = {
        requires_payment_method: "requires_payment_method",
        requires_confirmation: "requires_confirmation",
        requires_action: "requires_action",
        processing: "processing",
        succeeded: "succeeded",
        canceled: "canceled",
      };

      if (!result.client_secret) {
        logger.error("PayRex: Payment intent created but no client_secret returned", { result });
        throw new Error("Payment intent created but no client secret returned");
      }

      return {
        paymentIntentId: result.id,
        clientSecret: result.client_secret,
        status: statusMap[result.status] || "requires_payment_method",
        metadata: {
          order_id: request.orderId.toString(),
        },
      };
    } catch (error: any) {
      logger.error("PayRex: Failed to create payment intent", {
        error: error.message,
        stack: error.stack,
        status: error.response?.status,
        statusText: error.response?.statusText,
        responseData: error.response?.data,
        requestUrl: error.config?.url,
        requestMethod: error.config?.method,
        requestData: error.config?.data,
      });
      
      // If 404, provide more helpful error message
      if (error.response?.status === 404) {
        throw new Error(
          `PayRex API endpoint not found (404). Please verify the API endpoint is correct. ` +
          `Attempted: ${error.config?.url || 'unknown'}. ` +
          `Response: ${JSON.stringify(error.response?.data || {})}`
        );
      }
      
      throw new Error(`Failed to create payment intent: ${error.response?.data?.message || error.message}`);
    }
  }

  async confirmPayment(request: ConfirmPaymentRequest): Promise<ConfirmPaymentResponse> {
    try {
      const result = await this.payrex.confirmPaymentIntent(
        request.paymentIntentId,
        request.paymentMethodId
      );

      // Map PayRex status to our standard status
      const statusMap: Record<string, ConfirmPaymentResponse["status"]> = {
        succeeded: "succeeded",
        failed: "failed",
        canceled: "canceled",
        processing: "processing",
      };

      return {
        paymentIntentId: result.id,
        status: statusMap[result.status] || "failed",
        transactionId: result.id,
      };
    } catch (error: any) {
      logger.error("PayRex: Failed to confirm payment", error);
      return {
        paymentIntentId: request.paymentIntentId,
        status: "failed",
        error: {
          code: "payment_failed",
          message: error.message || "Payment confirmation failed",
        },
      };
    }
  }

  async getPaymentIntentStatus(paymentIntentId: string): Promise<PaymentIntentResponse> {
    try {
      const result = await this.payrex.retrievePaymentIntent(paymentIntentId);

      const statusMap: Record<string, PaymentIntentResponse["status"]> = {
        requires_payment_method: "requires_payment_method",
        requires_confirmation: "requires_confirmation",
        requires_action: "requires_action",
        processing: "processing",
        succeeded: "succeeded",
        canceled: "canceled",
      };

      return {
        paymentIntentId: result.id,
        clientSecret: result.client_secret,
        status: statusMap[result.status] || "requires_payment_method",
      };
    } catch (error: any) {
      logger.error("PayRex: Failed to get payment intent status", error);
      throw new Error(`Failed to get payment intent status: ${error.message}`);
    }
  }

  async cancelPaymentIntent(paymentIntentId: string): Promise<ConfirmPaymentResponse> {
    try {
      const result = await this.payrex.cancelPaymentIntent(paymentIntentId);

      const statusMap: Record<string, ConfirmPaymentResponse["status"]> = {
        succeeded: "succeeded",
        failed: "failed",
        canceled: "canceled",
        processing: "processing",
      };

      return {
        paymentIntentId: result.id,
        status: statusMap[result.status] || "canceled",
        transactionId: result.id,
      };
    } catch (error: any) {
      logger.error("PayRex: Failed to cancel payment intent", error);
      throw new Error(`Failed to cancel payment intent: ${error.message}`);
    }
  }

  async refund(request: RefundRequest): Promise<RefundResponse> {
    try {
      const result = await this.payrex.createRefund({
        payment_intent: request.paymentIntentId,
        amount: request.amount,
        reason: request.reason,
      });

      const statusMap: Record<string, RefundResponse["status"]> = {
        succeeded: "succeeded",
        pending: "pending",
        failed: "failed",
      };

      return {
        refundId: result.id,
        amount: result.amount,
        status: statusMap[result.status] || "pending",
        paymentIntentId: result.payment_intent,
      };
    } catch (error: any) {
      logger.error("PayRex: Failed to create refund", error);
      throw new Error(`Failed to create refund: ${error.message}`);
    }
  }

  /**
   * Create a checkout session for Checkout integration
   * This is a PayRex-specific method, not part of IPaymentProcessor
   */
  async createCheckoutSession(params: {
    amount: number;
    currency: string;
    success_url: string;
    cancel_url: string;
    orderId: number;
    metadata?: Record<string, string>;
  }): Promise<{ checkoutUrl: string; sessionId: string }> {
    try {
      const result = await this.payrex.createCheckoutSession({
        amount: params.amount,
        currency: params.currency,
        success_url: params.success_url,
        cancel_url: params.cancel_url,
        metadata: {
          order_id: params.orderId.toString(),
          ...params.metadata,
        },
        payment_methods: ["card"],
      });

      if (!result.url) {
        logger.error("PayRex: Checkout session created but no URL returned", { result });
        throw new Error("Checkout session created but no URL returned");
      }

      logger.info("PayRex: Checkout session created successfully", {
        sessionId: result.id,
        url: result.url,
      });

      return {
        checkoutUrl: result.url,
        sessionId: result.id,
      };
    } catch (error: any) {
      logger.error("PayRex: Failed to create checkout session", {
        error: error.message,
        stack: error.stack,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw new Error(`Failed to create checkout session: ${error.message}`);
    }
  }
}

