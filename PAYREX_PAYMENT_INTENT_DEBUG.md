# PayRex Payment Intent 404 Error - Debugging Guide

## The Problem

The code is trying to call `POST https://api.payrexhq.com/v1/payment_intents`, but it's returning a 404 error. This could mean:

1. **PayRex API doesn't exist or uses a different base URL**
2. **Wrong endpoint path** (e.g., `/payment-intents` vs `/payment_intents`)
3. **API key/authentication issue**
4. **PayRex is a test/mock service** that needs different handling

## Debugging Steps

### 1. Check the Server Logs

The enhanced logging should show:
- The exact URL being called
- The request payload
- The response data

Look for logs like:
```
PayRex: Creating payment intent
PayRex: Failed to create payment intent
```

### 2. Verify PayRex API Documentation

Check if:
- The base URL is correct (`https://api.payrexhq.com/v1`)
- The endpoint path is correct (`/payment_intents` vs `/payment-intents` vs something else)
- The API key format is correct
- PayRex is a real service or a mock/test service

### 3. Options to Handle This

#### Option A: If PayRex is a Mock/Test Service

Create a mock payment processor that simulates payment intents:

```typescript
// In PayRexProcessor.ts - modify createPaymentIntent method
async createPaymentIntent(params: {
  amount: number;
  currency: string;
  metadata?: Record<string, string>;
  payment_methods?: string[];
}): Promise<PayRexPaymentIntent> {
  // For testing: return mock data if API is not available
  if (process.env.PAYREX_MOCK === 'true' || process.env.NODE_ENV === 'development') {
    logger.warn("PayRex: Using mock payment intent (API not available)");
    return {
      id: `pi_mock_${Date.now()}`,
      client_secret: `cs_mock_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      status: "requires_payment_method",
      amount: params.amount,
      currency: params.currency,
      metadata: params.metadata || {},
    };
  }
  
  // ... existing API call code
}
```

#### Option B: If PayRex API Endpoint is Different

Update the endpoint path. Common variations:
- `/payment-intents` (hyphen instead of underscore)
- `/payments/intents`
- `/v1/payments/intents`

#### Option C: If PayRex Requires Different Authentication

Check if the API key format or headers need to be different.

### 4. Add Better Error Handling

Add a fallback that provides clearer errors:

```typescript
// In PayRexProcessor.ts createPaymentIntent method
catch (error: any) {
  logger.error("PayRex: Failed to create payment intent", {
    error: error.message,
    status: error.response?.status,
    statusText: error.response?.statusText,
    responseData: error.response?.data,
    requestUrl: `${this.baseURL}/payment_intents`,
    requestMethod: 'POST',
    requestData: requestData,
    headers: error.config?.headers,
  });
  
  // If 404, suggest checking API documentation
  if (error.response?.status === 404) {
    const errorMsg = `PayRex API endpoint not found. ` +
      `Please verify:\n` +
      `1. Base URL is correct: ${this.baseURL}\n` +
      `2. Endpoint path is correct: /payment_intents\n` +
      `3. API key is valid: ${secretKey.substring(0, 10)}...\n` +
      `4. PayRex service is available\n` +
      `Response: ${JSON.stringify(error.response?.data || {})}`;
    
    throw new Error(errorMsg);
  }
  
  throw new Error(`Failed to create payment intent: ${error.response?.data?.message || error.message}`);
}
```

## Recommended Next Steps

1. **Check server logs** - Look for the full error details (URL, request, response)
2. **Verify PayRex API documentation** - Confirm the correct endpoint format
3. **If PayRex is a test service** - Implement Option A (mock mode)
4. **If endpoint is wrong** - Update it per Option B
5. **Test with simple request** - Try a curl/Postman request to verify the endpoint works

## Environment Variables

Make sure these are set in your `.env` file:

```env
PAYREX_SECRET_KEY=sk_test_Qth9LZwqGVQeck5NqzQZgnnos3rZdbJa
PAYREX_PUBLIC_KEY=pk_test_JmsmYn7iJnjhm36Ha9hua5sQCZ1H14Gz

# Optional: Enable mock mode for testing
PAYREX_MOCK=true
```

## Current Implementation

The current code:
- Base URL: `https://api.payrexhq.com/v1`
- Endpoint: `/payment_intents`
- Authentication: `Bearer {secretKey}`
- Already has retry logic for hyphenated endpoint (`/payment-intents`)

## Testing the API Directly

You can test the PayRex API directly using curl:

```bash
curl -X POST https://api.payrexhq.com/v1/payment_intents \
  -H "Authorization: Bearer sk_test_Qth9LZwqGVQeck5NqzQZgnnos3rZdbJa" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 1000,
    "currency": "usd",
    "payment_methods": ["card"]
  }'
```

If this returns 404, the endpoint doesn't exist. Try:
- `/payment-intents` (with hyphen)
- Different base URL
- Check PayRex documentation for correct endpoint

## Error Location

The error occurs at:
- **File**: `server/services/payments/payrex/PayRexProcessor.ts`
- **Line**: ~314 (in the `createPaymentIntent` method)
- **Stack trace**: `PayRexProcessor.createPaymentIntent` → `paymentController.createPaymentIntent`

## Additional Debugging

To get more detailed error information, check the server logs for:
- Full request URL
- Request headers
- Request body
- Response status
- Response body

The enhanced logging should already capture most of this information.

