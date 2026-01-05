export interface ProductImageDtoType {
  id: number;
  url: string;
  is_main: boolean;
}

export interface ProductDtoType {
  id: number;
  name: string;
  description: string | null;
  base_price: number;
  country_of_origin: string | null;
  stock_quantity: number;
  manufacturer_id: number | null;
  images: ProductImageDtoType[];
  statuses: string[];
}

// Frontend-friendly product format
export interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number; // mapped from base_price
  country_of_origin: string | null;
  inStock: boolean; // mapped from stock_quantity > 0
  stock_quantity: number;
  manufacturer_id: number | null;
  images: ProductImageDtoType[];
  mainImage?: string; // first image or main image URL
  statuses: string[];
}

export function mapProductDtoToProduct(dto: ProductDtoType): Product {
  const mainImage = dto.images.find(img => img.is_main)?.url || dto.images[0]?.url || '/placeholder.svg';
  
  // Parse statuses if it's a JSON string, otherwise use as array
  let statuses: string[] = [];
  if (dto.statuses) {
    if (typeof dto.statuses === 'string') {
      try {
        statuses = JSON.parse(dto.statuses);
      } catch {
        statuses = [];
      }
    } else if (Array.isArray(dto.statuses)) {
      statuses = dto.statuses;
    }
  }
  
  return {
    id: dto.id,
    name: dto.name,
    description: dto.description,
    price: dto.base_price,
    country_of_origin: dto.country_of_origin,
    inStock: dto.stock_quantity > 0,
    stock_quantity: dto.stock_quantity,
    manufacturer_id: dto.manufacturer_id,
    images: dto.images,
    mainImage,
    statuses,
  };
}

