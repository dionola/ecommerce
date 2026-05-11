namespace Ecommerce.Domain.Models;

public sealed class Wishlist
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public List<WishlistItem> Items { get; set; } = [];
}

public sealed class WishlistItem
{
    public int WishlistId { get; set; }
    public int ProductId { get; set; }
    public Wishlist Wishlist { get; set; } = null!;
    public Product Product { get; set; } = null!;
}
