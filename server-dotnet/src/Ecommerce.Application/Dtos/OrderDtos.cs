using System.Text.Json;
using System.Text.Json.Serialization;

namespace Ecommerce.Application.Dtos;

public sealed record OrderPromoDto(int Id, string Code, [property: JsonPropertyName("discount_type")] string DiscountType, [property: JsonPropertyName("discount_value")] decimal DiscountValue);
public sealed record OrderItemDto(int Id, ProductDto Product, int Quantity, [property: JsonPropertyName("price_at_purchase")] decimal PriceAtPurchase);
public sealed record OrderDto(int Id, [property: JsonPropertyName("user_id")] int UserId, [property: JsonPropertyName("total_amount")] decimal TotalAmount, string Status, [property: JsonPropertyName("promo_id")] int? PromoId, OrderPromoDto? Promo, [property: JsonPropertyName("payment_intent_id")] string? PaymentIntentId, [property: JsonPropertyName("shipping_address")] JsonElement? ShippingAddress, [property: JsonPropertyName("created_at")] DateTimeOffset CreatedAt, IReadOnlyList<OrderItemDto> Items);
public sealed record OrderFilters(string? Status, int? UserId, string SortBy = "created_at", string Order = "desc", int Page = 1, int Limit = 20);
public sealed record CreateOrderDto([property: JsonPropertyName("shipping_address")] JsonElement ShippingAddress, [property: JsonPropertyName("promo_id")] int? PromoId, [property: JsonPropertyName("promo_code")] string? PromoCode, [property: JsonPropertyName("create_payment_intent")] bool CreatePaymentIntent, [property: JsonPropertyName("payment_processor")] string? PaymentProcessor);
public sealed record UpdateOrderDto(string? Status, [property: JsonPropertyName("payment_intent_id")] string? PaymentIntentId);
