import { api } from './api';

// Products
export interface AdminProduct {
  id: number;
  name: string;
  description: string | null;
  base_price: number;
  country_of_origin: string | null;
  stock_quantity: number;
  manufacturer_id: number | null;
  images: Array<{ id: number; url: string; is_main: boolean }>;
  statuses: string[];
}

export interface CreateProductData {
  name: string;
  description?: string | null;
  base_price: number;
  country_of_origin?: string | null;
  stock_quantity?: number;
  manufacturer_id?: number | null;
  images?: Array<{ url: string; is_main?: boolean }>;
}

export interface UpdateProductData {
  name?: string;
  description?: string | null;
  base_price?: number;
  country_of_origin?: string | null;
  stock_quantity?: number;
  manufacturer_id?: number | null;
}

// Manufacturers
export interface Manufacturer {
  id: number;
  name: string;
}

export interface CreateManufacturerData {
  name: string;
}

// Promos
export interface Promo {
  id: number;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  active_until: string | null;
}

export interface CreatePromoData {
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  active_until?: string | null;
}

// Users
export interface CreateUserData {
  email: string;
  password: string;
  fullName?: string;
  role: 'admin' | 'superadmin';
}

export interface CreateUserResponse {
  id: number;
  email: string;
  fullName: string | null;
  role: string;
  cognitoSub: string;
}

// Product Management
export async function createProduct(data: CreateProductData): Promise<AdminProduct> {
  const response = await api.post<AdminProduct>('/products', data);
  return response.data;
}

export async function updateProduct(id: number, data: UpdateProductData): Promise<AdminProduct> {
  const response = await api.patch<AdminProduct>(`/products/${id}`, data);
  return response.data;
}

export async function deleteProduct(id: number): Promise<void> {
  await api.delete(`/products/${id}`);
}

// Manufacturer Management
export async function getManufacturers(): Promise<Manufacturer[]> {
  const response = await api.get<Manufacturer[]>('/manufacturers');
  return response.data;
}

export async function createManufacturer(data: CreateManufacturerData): Promise<Manufacturer> {
  const response = await api.post<Manufacturer>('/manufacturers', data);
  return response.data;
}

export async function updateManufacturer(id: number, data: CreateManufacturerData): Promise<Manufacturer> {
  const response = await api.patch<Manufacturer>(`/manufacturers/${id}`, data);
  return response.data;
}

export async function deleteManufacturer(id: number): Promise<void> {
  await api.delete(`/manufacturers/${id}`);
}

// Promo Management
export async function getPromos(): Promise<Promo[]> {
  const response = await api.get<Promo[]>('/promos');
  return response.data;
}

export async function createPromo(data: CreatePromoData): Promise<Promo> {
  const response = await api.post<Promo>('/promos', data);
  return response.data;
}

export async function updatePromo(id: number, data: Partial<CreatePromoData>): Promise<Promo> {
  const response = await api.patch<Promo>(`/promos/${id}`, data);
  return response.data;
}

export async function deletePromo(id: number): Promise<void> {
  await api.delete(`/promos/${id}`);
}

// User Management
export async function createUser(data: CreateUserData): Promise<CreateUserResponse> {
  const response = await api.post<CreateUserResponse>('/users', data);
  return response.data;
}

