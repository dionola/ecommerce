using Ecommerce.Application.Dtos;
using Ecommerce.Application.Errors;
using Ecommerce.Application.Services;
using Ecommerce.Infrastructure.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Stripe.Checkout;

namespace Ecommerce.Infrastructure.ExternalClients;

public sealed class AspNetIdentityAdminClient(
    UserManager<ApplicationIdentityUser> userManager,
    RoleManager<IdentityRole> roleManager) : IIdentityAdminClient
{
    public async Task<CreatedIdentityUser> CreateAdminUserAsync(string email, string password, string? fullName, string role, CancellationToken cancellationToken)
    {
        await EnsureRoleAsync(role);

        var existing = await userManager.FindByEmailAsync(email);
        if (existing is not null)
        {
            throw new ApiException($"User with email {email} already exists", 422);
        }

        var identityUser = new ApplicationIdentityUser
        {
            UserName = email,
            Email = email,
            EmailConfirmed = true,
            FullName = fullName
        };

        var result = await userManager.CreateAsync(identityUser, password);
        if (!result.Succeeded)
        {
            throw new ApiException("Failed to create ASP.NET Identity user", 422, result.Errors.Select(e => new { field = e.Code, message = e.Description }).ToArray());
        }

        var roleResult = await userManager.AddToRoleAsync(identityUser, role);
        if (!roleResult.Succeeded)
        {
            throw new ApiException("Failed to assign ASP.NET Identity role", 422, roleResult.Errors.Select(e => new { field = e.Code, message = e.Description }).ToArray());
        }

        return new CreatedIdentityUser(identityUser.Id, email, fullName);
    }

    public async Task SetUserRoleAsync(string email, string role, CancellationToken cancellationToken)
    {
        await EnsureRoleAsync(role);

        var identityUser = await userManager.FindByEmailAsync(email)
            ?? throw new ApiException($"ASP.NET Identity user with email {email} not found", 422);

        var existingRoles = await userManager.GetRolesAsync(identityUser);
        if (existingRoles.Count > 0)
        {
            var removeResult = await userManager.RemoveFromRolesAsync(identityUser, existingRoles);
            if (!removeResult.Succeeded)
            {
                throw new ApiException("Failed to remove existing ASP.NET Identity roles", 422, removeResult.Errors.Select(e => new { field = e.Code, message = e.Description }).ToArray());
            }
        }

        var addResult = await userManager.AddToRoleAsync(identityUser, role);
        if (!addResult.Succeeded)
        {
            throw new ApiException("Failed to assign ASP.NET Identity role", 422, addResult.Errors.Select(e => new { field = e.Code, message = e.Description }).ToArray());
        }
    }

    private async Task EnsureRoleAsync(string role)
    {
        if (!await roleManager.RoleExistsAsync(role))
        {
            var result = await roleManager.CreateAsync(new IdentityRole(role));
            if (!result.Succeeded)
            {
                throw new ApiException($"Failed to create ASP.NET Identity role {role}", 422, result.Errors.Select(e => new { field = e.Code, message = e.Description }).ToArray());
            }
        }
    }
}

public sealed class StripePaymentGateway : IPaymentGateway
{
    private readonly string? _secretKey;

    public StripePaymentGateway(IConfiguration configuration)
    {
        _secretKey = configuration["Stripe:SecretKey"] ?? configuration["STRIPE_SECRET_KEY"];
        if (!string.IsNullOrWhiteSpace(_secretKey))
        {
            Stripe.StripeConfiguration.ApiKey = _secretKey;
        }
    }

    public bool IsAvailable => !string.IsNullOrWhiteSpace(_secretKey);

    public async Task<CheckoutSessionResponseDto> CreateCheckoutSessionAsync(CreateCheckoutSessionRequest request, CancellationToken cancellationToken)
    {
        if (!IsAvailable)
        {
            throw new ApiException("Payments are currently unavailable", 503);
        }

        var options = new SessionCreateOptions
        {
            Mode = "payment",
            SuccessUrl = request.SuccessUrl,
            CancelUrl = request.CancelUrl,
            Metadata = new Dictionary<string, string>(request.Metadata)
            {
                ["order_id"] = request.OrderId.ToString()
            },
            LineItems = request.LineItems.Select(item => new SessionLineItemOptions
            {
                Quantity = item.Quantity,
                PriceData = new SessionLineItemPriceDataOptions
                {
                    Currency = request.Currency,
                    UnitAmount = item.UnitAmount,
                    ProductData = new SessionLineItemPriceDataProductDataOptions
                    {
                        Name = item.Name,
                        Images = string.IsNullOrWhiteSpace(item.ImageUrl) ? null : [item.ImageUrl]
                    }
                }
            }).ToList()
        };

        var session = await new SessionService().CreateAsync(options, cancellationToken: cancellationToken);
        if (string.IsNullOrWhiteSpace(session.Url))
        {
            throw new ApiException("Checkout session created but no URL returned", 500);
        }

        return new CheckoutSessionResponseDto(session.Url, session.Id);
    }

    public async Task<VerifiedCheckoutSession> VerifyCheckoutSessionAsync(string sessionId, CancellationToken cancellationToken)
    {
        if (!IsAvailable)
        {
            throw new ApiException("Payments are currently unavailable", 503);
        }

        var session = await new SessionService().GetAsync(sessionId, cancellationToken: cancellationToken);
        var orderId = session.Metadata.TryGetValue("order_id", out var value) && int.TryParse(value, out var parsed) ? parsed : (int?)null;
        return new VerifiedCheckoutSession(session.PaymentStatus == "paid" ? "paid" : session.Status, orderId, session.PaymentIntentId);
    }
}
