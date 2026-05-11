namespace Ecommerce.Application.Errors;

public sealed class ApiException(string message, int statusCode, object? errors = null) : Exception(message)
{
    public int StatusCode { get; } = statusCode;
    public object? Errors { get; } = errors;
}
