import apiRequest from './api';
import type { ProductDtoType } from '../types/product';

export interface ProductFilters {
  search?: string;
  min_price?: number;
  max_price?: number;
  manufacturer_id?: number;
  country_of_origin?: string;
  in_stock?: boolean;
  sort_by?: 'name' | 'price' | 'created_at';
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  category?: string;
}

export interface GetProductsResponse {
  products: ProductDtoType[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export async function getProducts(filters: ProductFilters = {}): Promise<GetProductsResponse> {
  const params = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  });

  const queryString = params.toString();
  const endpoint = `/products${queryString ? `?${queryString}` : ''}`;
  
  return apiRequest<GetProductsResponse>(endpoint);
}

export async function getProduct(id: number): Promise<ProductDtoType> {
  return apiRequest<ProductDtoType>(`/products/${id}`);
}

