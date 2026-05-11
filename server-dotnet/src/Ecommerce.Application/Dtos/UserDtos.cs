namespace Ecommerce.Application.Dtos;

public sealed record CreateUserDto(string Email, string Password, string? FullName, string Role);
public sealed record CreateUserResponseDto(int Id, string Email, string? FullName, string Role, string CognitoSub);
public sealed record UserListItemDto(int Id, string Email, string? FullName, string CognitoSub, string Role, int OrderCount, int TotalItemsOrdered, string CreatedAt);
