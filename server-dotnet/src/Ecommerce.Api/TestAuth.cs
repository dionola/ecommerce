using System.Security.Claims;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Options;

public sealed class TestAuthOptions : AuthenticationSchemeOptions;

public sealed class TestAuthHandler(
    IOptionsMonitor<TestAuthOptions> options,
    ILoggerFactory logger,
    UrlEncoder encoder) : AuthenticationHandler<TestAuthOptions>(options, logger, encoder)
{
    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        if (!Request.Headers.TryGetValue("Authorization", out var header) || string.IsNullOrWhiteSpace(header))
        {
            return Task.FromResult(AuthenticateResult.NoResult());
        }

        var value = header.ToString();
        if (!value.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        {
            return Task.FromResult(AuthenticateResult.Fail("Invalid authorization header"));
        }

        var token = value["Bearer ".Length..];
        if (token.Contains("invalid", StringComparison.OrdinalIgnoreCase))
        {
            return Task.FromResult(AuthenticateResult.Fail("Invalid token"));
        }
        var role = token.Contains("superadmin", StringComparison.OrdinalIgnoreCase)
            ? "superadmin"
            : token.Contains("admin", StringComparison.OrdinalIgnoreCase)
                ? "admin"
                : "customer";
        var suffix = token.Contains("other", StringComparison.OrdinalIgnoreCase) ? "other" : role;
        var email = suffix == "customer" ? "user@example.com" : $"{suffix}@example.com";
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, $"{suffix}-sub-123"),
            new(ClaimTypes.Email, email),
            new(ClaimTypes.Role, role)
        };
        var identity = new ClaimsIdentity(claims, Scheme.Name);
        var principal = new ClaimsPrincipal(identity);
        return Task.FromResult(AuthenticateResult.Success(new AuthenticationTicket(principal, Scheme.Name)));
    }
}
