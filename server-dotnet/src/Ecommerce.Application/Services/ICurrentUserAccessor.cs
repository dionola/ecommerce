using System.Security.Claims;

namespace Ecommerce.Application.Services;

public sealed record AuthUser(string Sub, string? Email, string[] Roles)
{
    public bool IsAdmin => Roles.Contains("admin") || Roles.Contains("superadmin");
    public string? HighestRole => Roles.Contains("superadmin") ? "superadmin" : Roles.Contains("admin") ? "admin" : "customer";
}

public interface ICurrentUserAccessor
{
    AuthUser? GetCurrentUser(ClaimsPrincipal principal);
}

public sealed class ClaimsCurrentUserAccessor : ICurrentUserAccessor
{
    public AuthUser? GetCurrentUser(ClaimsPrincipal principal)
    {
        if (principal.Identity?.IsAuthenticated != true)
        {
            return null;
        }

        var sub = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? principal.FindFirst("sub")?.Value;
        if (string.IsNullOrWhiteSpace(sub))
        {
            return null;
        }

        var email = principal.FindFirst(ClaimTypes.Email)?.Value
            ?? principal.FindFirst("email")?.Value;
        var roles = principal.FindAll(ClaimTypes.Role).Select(c => c.Value)
            .Concat(principal.FindAll("roles").Select(c => c.Value))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

        return new AuthUser(sub, email, roles);
    }
}
