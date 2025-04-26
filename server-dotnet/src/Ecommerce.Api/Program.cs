using System.Text.Json;
using System.Text.Json.Serialization;
using Ecommerce.Api.Endpoints;
using Ecommerce.Application.Dtos;
using Ecommerce.Application.Errors;
using Ecommerce.Application.Services;
using Ecommerce.Infrastructure.Data;
using Ecommerce.Infrastructure.Services;
using Ecommerce.Infrastructure.ExternalClients;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower;
    options.SerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
});
builder.Services.Configure<JsonOptions>(options =>
{
    options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower;
    options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
});

builder.Services.AddControllers().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower;
    options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
});
builder.Services.AddOpenApi();
builder.Services.AddEndpointsApiExplorer();

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? builder.Configuration["SQLSERVER_CONNECTION_STRING"]
    ?? "Server=(localdb)\\MSSQLLocalDB;Database=Ecommerce;Trusted_Connection=True;TrustServerCertificate=True";

builder.Services.AddDbContext<EcommerceDbContext>(options => options.UseSqlServer(connectionString));
builder.Services.AddScoped<EcommerceService>();
builder.Services.AddScoped<ICurrentUserAccessor, ClaimsCurrentUserAccessor>();
builder.Services.AddScoped<IIdentityAdminClient, AspNetIdentityAdminClient>();
builder.Services.AddScoped<IPaymentGateway, StripePaymentGateway>();

builder.Services.AddIdentityCore<ApplicationIdentityUser>(options =>
    {
        options.User.RequireUniqueEmail = true;
        options.Password.RequiredLength = 8;
        options.Password.RequireDigit = true;
        options.Password.RequireLowercase = true;
        options.Password.RequireUppercase = true;
        options.Password.RequireNonAlphanumeric = false;
    })
    .AddRoles<IdentityRole>()
    .AddEntityFrameworkStores<EcommerceDbContext>()
    .AddApiEndpoints();

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(builder.Configuration["FrontendUrl"] ?? builder.Configuration["FRONTEND_URL"] ?? "http://localhost:5173")
            .AllowAnyHeader()
            .WithMethods("GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS")
            .AllowCredentials();
    });
});

if (builder.Environment.IsEnvironment("Testing"))
{
    builder.Services.AddAuthentication("Test").AddScheme<TestAuthOptions, TestAuthHandler>("Test", _ => { });
}
else
{
    builder.Services.AddAuthentication(IdentityConstants.BearerScheme)
        .AddBearerToken(IdentityConstants.BearerScheme);
}

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("Admin", policy => policy.RequireRole("admin", "superadmin"));
});

var app = builder.Build();

app.UseExceptionHandler(errorApp =>
{
    errorApp.Run(async context =>
    {
        var exception = context.Features.Get<IExceptionHandlerFeature>()?.Error;
        (int status, object payload) = exception switch
        {
            ApiException api => (api.StatusCode, (object)new { message = api.Message, errors = api.Errors }),
            _ => (StatusCodes.Status500InternalServerError, (object)new { message = "Internal server error", error = app.Environment.IsDevelopment() ? exception?.Message : null })
        };
        context.Response.StatusCode = status;
        context.Response.ContentType = "application/json";
        await context.Response.WriteAsJsonAsync(payload);
    });
});

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

app.MapEcommerceEndpoints();

app.Run();

public partial class Program;
