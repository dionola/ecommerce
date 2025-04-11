namespace Ecommerce.Application.Services;

public interface IIdentityAdminClient
{
    Task<CreatedIdentityUser> CreateAdminUserAsync(string email, string password, string? fullName, string role, CancellationToken cancellationToken);
    Task SetUserRoleAsync(string email, string role, CancellationToken cancellationToken);
}

public sealed record CreatedIdentityUser(string ObjectId, string Email, string? FullName);
