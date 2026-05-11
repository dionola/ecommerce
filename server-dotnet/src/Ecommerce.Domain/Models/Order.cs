namespace Ecommerce.Domain.Models;

public sealed class Order
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public decimal TotalAmount { get; set; }
    public string Status { get; set; } = "pending";
    public int? PromoId { get; set; }
    public string? PaymentIntentId { get; set; }
    public string? ShippingAddressJson { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public User User { get; set; } = null!;
    public Promo? Promo { get; set; }
    public List<OrderItem> Items { get; set; } = [];
}

public sealed class OrderItem
{
    public int Id { get; set; }
    public int OrderId { get; set; }
    public int ProductId { get; set; }
    public int Quantity { get; set; }
    public decimal PriceAtPurchase { get; set; }
    public Order Order { get; set; } = null!;
    public Product Product { get; set; } = null!;
}
