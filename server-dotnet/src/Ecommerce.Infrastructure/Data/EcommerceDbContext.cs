using Ecommerce.Domain.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.Infrastructure.Data;

public sealed class ApplicationIdentityUser : IdentityUser
{
    public string? FullName { get; set; }
}

public sealed class EcommerceDbContext(DbContextOptions<EcommerceDbContext> options) : IdentityDbContext<ApplicationIdentityUser, IdentityRole, string>(options)
{
    public DbSet<User> StoreUsers => Set<User>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<ProductImage> ProductImages => Set<ProductImage>();
    public DbSet<ProductStatus> ProductStatuses => Set<ProductStatus>();
    public DbSet<Manufacturer> Manufacturers => Set<Manufacturer>();
    public DbSet<Cart> Carts => Set<Cart>();
    public DbSet<CartItem> CartItems => Set<CartItem>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<Promo> Promos => Set<Promo>();
    public DbSet<Wishlist> Wishlists => Set<Wishlist>();
    public DbSet<WishlistItem> WishlistItems => Set<WishlistItem>();
    public DbSet<BannerConfig> BannerConfigs => Set<BannerConfig>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("users");
            entity.Property(x => x.Id).HasColumnName("id");
            entity.Property(x => x.IdentityUserId).HasColumnName("aspnet_identity_user_id").HasMaxLength(450);
            entity.Property(x => x.Email).HasColumnName("email").HasMaxLength(320);
            entity.Property(x => x.FullName).HasColumnName("full_name").HasMaxLength(255);
            entity.Property(x => x.Role).HasColumnName("role").HasMaxLength(32).HasDefaultValue("customer");
            entity.Property(x => x.CreatedAt).HasColumnName("created_at");
            entity.HasIndex(x => x.IdentityUserId).IsUnique();
            entity.HasIndex(x => x.Email);
        });

        modelBuilder.Entity<Manufacturer>(entity =>
        {
            entity.ToTable("manufacturers");
            entity.Property(x => x.Id).HasColumnName("id");
            entity.Property(x => x.Name).HasColumnName("name").HasMaxLength(255);
            entity.HasIndex(x => x.Name).IsUnique();
        });

        modelBuilder.Entity<Product>(entity =>
        {
            entity.ToTable("products");
            entity.Property(x => x.Id).HasColumnName("id");
            entity.Property(x => x.Name).HasColumnName("name").HasMaxLength(255);
            entity.Property(x => x.Description).HasColumnName("description");
            entity.Property(x => x.BasePrice).HasColumnName("base_price").HasPrecision(18, 2);
            entity.Property(x => x.CountryOfOrigin).HasColumnName("country_of_origin").HasMaxLength(100);
            entity.Property(x => x.StockQuantity).HasColumnName("stock_quantity");
            entity.Property(x => x.ManufacturerId).HasColumnName("manufacturer_id");
            entity.Property(x => x.Category).HasColumnName("category").HasMaxLength(100);
            entity.Property(x => x.CreatedAt).HasColumnName("created_at");
            entity.HasOne(x => x.Manufacturer).WithMany(x => x.Products).HasForeignKey(x => x.ManufacturerId).OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<ProductImage>(entity =>
        {
            entity.ToTable("product_images");
            entity.Property(x => x.Id).HasColumnName("id");
            entity.Property(x => x.ProductId).HasColumnName("product_id");
            entity.Property(x => x.Url).HasColumnName("url").HasMaxLength(2048);
            entity.Property(x => x.IsMain).HasColumnName("is_main");
            entity.Property(x => x.SortOrder).HasColumnName("sort_order");
            entity.HasOne(x => x.Product).WithMany(x => x.Images).HasForeignKey(x => x.ProductId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ProductStatus>(entity =>
        {
            entity.ToTable("product_statuses");
            entity.Property(x => x.Id).HasColumnName("id");
            entity.Property(x => x.ProductId).HasColumnName("product_id");
            entity.Property(x => x.StatusType).HasColumnName("status_type").HasMaxLength(100);
            entity.HasIndex(x => new { x.ProductId, x.StatusType }).IsUnique();
            entity.HasOne(x => x.Product).WithMany(x => x.Statuses).HasForeignKey(x => x.ProductId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Cart>(entity =>
        {
            entity.ToTable("carts");
            entity.Property(x => x.Id).HasColumnName("id");
            entity.Property(x => x.UserId).HasColumnName("user_id");
            entity.Property(x => x.UpdatedAt).HasColumnName("updated_at");
            entity.HasIndex(x => x.UserId).IsUnique();
            entity.HasOne(x => x.User).WithOne(x => x.Cart).HasForeignKey<Cart>(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<CartItem>(entity =>
        {
            entity.ToTable("cart_items");
            entity.Property(x => x.Id).HasColumnName("id");
            entity.Property(x => x.CartId).HasColumnName("cart_id");
            entity.Property(x => x.ProductId).HasColumnName("product_id");
            entity.Property(x => x.Quantity).HasColumnName("quantity");
            entity.HasIndex(x => new { x.CartId, x.ProductId }).IsUnique();
            entity.HasOne(x => x.Cart).WithMany(x => x.Items).HasForeignKey(x => x.CartId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(x => x.Product).WithMany().HasForeignKey(x => x.ProductId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Promo>(entity =>
        {
            entity.ToTable("promos");
            entity.Property(x => x.Id).HasColumnName("id");
            entity.Property(x => x.Code).HasColumnName("code").HasMaxLength(50);
            entity.Property(x => x.DiscountType).HasColumnName("discount_type").HasMaxLength(20);
            entity.Property(x => x.DiscountValue).HasColumnName("discount_value").HasPrecision(18, 2);
            entity.Property(x => x.ActiveUntil).HasColumnName("active_until");
            entity.HasIndex(x => x.Code).IsUnique();
        });

        modelBuilder.Entity<Order>(entity =>
        {
            entity.ToTable("orders");
            entity.Property(x => x.Id).HasColumnName("id");
            entity.Property(x => x.UserId).HasColumnName("user_id");
            entity.Property(x => x.TotalAmount).HasColumnName("total_amount").HasPrecision(18, 2);
            entity.Property(x => x.Status).HasColumnName("status").HasMaxLength(50);
            entity.Property(x => x.PromoId).HasColumnName("promo_id");
            entity.Property(x => x.PaymentIntentId).HasColumnName("payment_intent_id").HasMaxLength(255);
            entity.Property(x => x.ShippingAddressJson).HasColumnName("shipping_address").HasColumnType("nvarchar(max)");
            entity.Property(x => x.CreatedAt).HasColumnName("created_at");
            entity.HasOne(x => x.User).WithMany(x => x.Orders).HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(x => x.Promo).WithMany().HasForeignKey(x => x.PromoId).OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<OrderItem>(entity =>
        {
            entity.ToTable("order_items");
            entity.Property(x => x.Id).HasColumnName("id");
            entity.Property(x => x.OrderId).HasColumnName("order_id");
            entity.Property(x => x.ProductId).HasColumnName("product_id");
            entity.Property(x => x.Quantity).HasColumnName("quantity");
            entity.Property(x => x.PriceAtPurchase).HasColumnName("price_at_purchase").HasPrecision(18, 2);
            entity.HasOne(x => x.Order).WithMany(x => x.Items).HasForeignKey(x => x.OrderId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(x => x.Product).WithMany().HasForeignKey(x => x.ProductId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Wishlist>(entity =>
        {
            entity.ToTable("wishlists");
            entity.Property(x => x.Id).HasColumnName("id");
            entity.Property(x => x.UserId).HasColumnName("user_id");
            entity.HasIndex(x => x.UserId).IsUnique();
            entity.HasOne(x => x.User).WithOne(x => x.Wishlist).HasForeignKey<Wishlist>(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<WishlistItem>(entity =>
        {
            entity.ToTable("wishlist_items");
            entity.HasKey(x => new { x.WishlistId, x.ProductId });
            entity.Property(x => x.WishlistId).HasColumnName("wishlist_id");
            entity.Property(x => x.ProductId).HasColumnName("product_id");
            entity.HasOne(x => x.Wishlist).WithMany(x => x.Items).HasForeignKey(x => x.WishlistId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(x => x.Product).WithMany().HasForeignKey(x => x.ProductId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<BannerConfig>(entity =>
        {
            entity.ToTable("banner_config");
            entity.Property(x => x.Id).HasColumnName("id");
            entity.Property(x => x.Title).HasColumnName("title").HasMaxLength(255);
            entity.Property(x => x.Description).HasColumnName("description");
            entity.Property(x => x.ImageUrl).HasColumnName("image_url").HasMaxLength(2048);
            entity.Property(x => x.Category).HasColumnName("category").HasMaxLength(100);
            entity.Property(x => x.ButtonText).HasColumnName("button_text").HasMaxLength(100);
            entity.Property(x => x.CreatedAt).HasColumnName("created_at");
            entity.Property(x => x.UpdatedAt).HasColumnName("updated_at");
        });
    }
}
