namespace Ecommerce.Domain.Models;

public sealed class Promo
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string DiscountType { get; set; } = "percentage";
    public decimal DiscountValue { get; set; }
    public DateTimeOffset? ActiveUntil { get; set; }
}
