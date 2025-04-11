using System.Text.Json.Serialization;

namespace Ecommerce.Application.Dtos;

public sealed record CreateCheckoutSessionDto([property: JsonPropertyName("order_id")] int OrderId, [property: JsonPropertyName("success_url")] string? SuccessUrl, [property: JsonPropertyName("cancel_url")] string? CancelUrl);
public sealed record CheckoutSessionResponseDto(string CheckoutUrl, string SessionId);
