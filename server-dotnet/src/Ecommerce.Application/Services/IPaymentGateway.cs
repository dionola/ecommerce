using Ecommerce.Application.Dtos;

namespace Ecommerce.Application.Services;

public interface IPaymentGateway
{
    bool IsAvailable { get; }
    Task<CheckoutSessionResponseDto> CreateCheckoutSessionAsync(CreateCheckoutSessionRequest request, CancellationToken cancellationToken);
    Task<VerifiedCheckoutSession> VerifyCheckoutSessionAsync(string sessionId, CancellationToken cancellationToken);
}

public sealed record CreateCheckoutSessionRequest(
    int OrderId,
    string Currency,
    string SuccessUrl,
    string CancelUrl,
    IReadOnlyList<CheckoutLineItem> LineItems,
    Dictionary<string, string> Metadata);

public sealed record CheckoutLineItem(string Name, long UnitAmount, int Quantity, string? ImageUrl);
public sealed record VerifiedCheckoutSession(string Status, int? OrderId, string? PaymentIntentId);
