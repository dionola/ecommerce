namespace Ecommerce.Domain.Models;

public sealed class Cart
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
    public User User { get; set; } = null!;
    public List<CartItem> Items { get; set; } = [];
}

public sealed class CartItem
{
    public int Id { get; set; }
    public int CartId { get; set; }
    public int ProductId { get; set; }
    public int Quantity { get; set; }
    public Cart Cart { get; set; } = null!;
    public Product Product { get; set; } = null!;
}
