namespace Ecommerce.Application.Dtos;

public sealed record ManufacturerDto(int Id, string Name);
public sealed record CreateManufacturerDto(string Name);
public sealed record UpdateManufacturerDto(string? Name);
