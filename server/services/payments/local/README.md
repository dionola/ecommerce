# Local Payment Processors

This directory is for local payment processor implementations.

## Adding a New Local Processor

To add a new local payment processor (e.g., `local1` or `local2`):

1. Create a new file: `server/services/payments/local/Local1Processor.ts` (or `Local2Processor.ts`)

2. Implement the `IPaymentProcessor` interface:

```typescript
import { IPaymentProcessor } from "../PaymentProcessor";
import {
  PaymentIntentRequest,
  PaymentIntentResponse,
  ConfirmPaymentRequest,
  ConfirmPaymentResponse,
  RefundRequest,
  RefundResponse,
} from "../paymentTypes";

export class Local1Processor implements IPaymentProcessor {
  async createPaymentIntent(request: PaymentIntentRequest): Promise<PaymentIntentResponse> {
    // Your implementation here
    // Return payment intent with unique ID
  }

  async confirmPayment(request: ConfirmPaymentRequest): Promise<ConfirmPaymentResponse> {
    // Your implementation here
  }

  async getPaymentIntentStatus(paymentIntentId: string): Promise<PaymentIntentResponse> {
    // Your implementation here
  }

  async cancelPaymentIntent(paymentIntentId: string): Promise<ConfirmPaymentResponse> {
    // Your implementation here
  }

  async refund(request: RefundRequest): Promise<RefundResponse> {
    // Your implementation here
  }
}
```

3. Register it in `paymentService.ts`:

```typescript
import { Local1Processor } from "./local/Local1Processor";

constructor() {
  this.processors.set("stripe", new StripeProcessor());
  this.processors.set("local1", new Local1Processor()); // Add this line
  // ...
}
```

4. Update the DTOs to include your processor type (already done - `local1` and `local2` are already in the enum)

That's it! The payment facade will automatically route requests to your processor when `processor: "local1"` is specified in the request.

## Example Usage

```typescript
// Create payment intent with local processor
const paymentIntent = await paymentService.createPaymentIntent(
  {
    amount: 10000, // in cents
    currency: "usd",
    orderId: 123,
  },
  "local1" // Specify your processor
);
```





