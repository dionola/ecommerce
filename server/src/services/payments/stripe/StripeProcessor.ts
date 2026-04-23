import Stripe from "stripe";
import { IPaymentProcessor } from "../PaymentProcessor.js";
import { logger } from "../../../utils/logger.js";

export class StripeProcessor implements IPaymentProcessor {
    private stripe: Stripe;

    constructor() {
        const secretKey = process.env.STRIPE_SECRET_KEY;

        if (!secretKey) {
            throw new Error("STRIPE_SECRET_KEY environment variable is required");
        }

        // Use Stripe SDK default API version (pinned to SDK release)
        this.stripe = new Stripe(secretKey);

        logger.info("StripeProcessor initialized");
    }

    /**
     * Create a checkout session for Stripe Checkout integration
     */
    async createCheckoutSession(params: {
        currency: string;
        success_url: string;
        cancel_url: string;
        orderId: number;
        lineItems: Array<{
            name: string;
            unitAmount: number;
            quantity: number;
            imageUrl?: string;
        }>;
        metadata?: Record<string, string>;
    }): Promise<{ checkoutUrl: string; sessionId: string }> {
        try {
            logger.info("Stripe: Creating checkout session", {
                orderId: params.orderId,
                lineItemCount: params.lineItems.length,
            });

            const session = await this.stripe.checkout.sessions.create({
                payment_method_types: ["card"],
                line_items: params.lineItems.map((item) => ({
                    price_data: {
                        currency: params.currency,
                        product_data: {
                            name: item.name,
                            ...(item.imageUrl ? { images: [item.imageUrl] } : {}),
                        },
                        unit_amount: item.unitAmount,
                    },
                    quantity: item.quantity,
                })),
                mode: "payment",
                success_url: params.success_url,
                cancel_url: params.cancel_url,
                metadata: {
                    order_id: params.orderId.toString(),
                    ...params.metadata,
                },
            });

            if (!session.url) {
                logger.error("Stripe: Checkout session created but no URL returned", { session });
                throw new Error("Checkout session created but no URL returned");
            }

            logger.info("Stripe: Checkout session created successfully", {
                sessionId: session.id,
                url: session.url,
            });

            return {
                checkoutUrl: session.url,
                sessionId: session.id,
            };
        } catch (error: any) {
            logger.error("Stripe: Failed to create checkout session", {
                error: error.message,
                type: error.type,
                code: error.code,
            });

            throw new Error(`Failed to create checkout session: ${error.message}`);
        }
    }
    async verifyCheckoutSession(sessionId: string): Promise<{ paymentIntentId: string; status: string; orderId?: number }> {
        try {
            logger.info("Stripe: Verifying checkout session", { sessionId });

            const session = await this.stripe.checkout.sessions.retrieve(sessionId);

            if (!session) {
                throw new Error("Checkout session not found");
            }

            const paymentIntentId = typeof session.payment_intent === 'string'
                ? session.payment_intent
                : (session.payment_intent as Stripe.PaymentIntent)?.id;

            const orderId = session.metadata?.order_id ? parseInt(session.metadata.order_id, 10) : undefined;

            return {
                paymentIntentId: paymentIntentId || '',
                status: session.payment_status,
                orderId,
            };
        } catch (error: any) {
            logger.error("Stripe: Failed to verify checkout session", {
                error: error.message,
                sessionId,
            });
            throw new Error(`Failed to verify checkout session: ${error.message}`);
        }
    }
}
