namespace Ecommerce.Domain.Models;

public sealed class Product
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal BasePrice { get; set; }
    public string? CountryOfOrigin { get; set; }
    public int StockQuantity { get; set; }
    public int? ManufacturerId { get; set; }
    public string? Category { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public Manufacturer? Manufacturer { get; set; }
    public List<ProductImage> Images { get; set; } = [];
    public List<ProductStatus> Statuses { get; set; } = [];
}

public sealed class ProductImage
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public string Url { get; set; } = string.Empty;
    public bool IsMain { get; set; }
    public int SortOrder { get; set; }
    public Product Product { get; set; } = null!;
}

public sealed class ProductStatus
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public string StatusType { get; set; } = string.Empty;
    public Product Product { get; set; } = null!;
}
