namespace Ecommerce.Domain.Models;

public sealed class User
{
    public int Id { get; set; }
    public string IdentityUserId { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? FullName { get; set; }
    public string Role { get; set; } = "customer";
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public Cart? Cart { get; set; }
    public Wishlist? Wishlist { get; set; }
    public List<Order> Orders { get; set; } = [];
}
