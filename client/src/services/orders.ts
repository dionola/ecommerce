import { api } from './api';

export interface OrderItem {
  id: number;
  product: {
    id: number;
    name: string;
    base_price: number;
    images: Array<{ url: string; is_main: boolean }>;
  };
  quantity: number;
  price_at_purchase: number;
}

export interface Order {
  id: number;
  user_id: number;
  total_amount: number;
  status: string;
  promo_id: number | null;
  stripe_payment_intent_id: string | null;
  shipping_address: Record<string, unknown> | null;
  created_at: string;
  items: OrderItem[];
}

export interface GetOrdersParams {
  status?: string;
  user_id?: number;
  sort_by?: 'created_at' | 'total_amount' | 'status';
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export async function getOrders(params?: GetOrdersParams): Promise<Order[]> {
  const queryParams = new URLSearchParams();
  if (params?.status) queryParams.append('status', params.status);
  if (params?.user_id) queryParams.append('user_id', params.user_id.toString());
  if (params?.sort_by) queryParams.append('sort_by', params.sort_by);
  if (params?.order) queryParams.append('order', params.order);
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());

  const response = await api.get<Order[]>(`/orders?${queryParams.toString()}`);
  return response.data;
}

export async function getOrderById(id: number): Promise<Order> {
  const response = await api.get<Order>(`/orders/${id}`);
  return response.data;
}

export interface CreateOrderData {
  shipping_address: Record<string, unknown>;
  promo_id?: number | null;
  promo_code?: string;
  create_payment_intent?: boolean;
  payment_processor?: 'stripe' | 'local1' | 'local2';
}

export async function createOrder(data: CreateOrderData): Promise<Order> {
  const response = await api.post<Order>('/orders', data);
  return response.data;
}

export async function updateOrder(id: number, data: { status?: string; stripe_payment_intent_id?: string | null }): Promise<Order> {
  const response = await api.patch<Order>(`/orders/${id}`, data);
  return response.data;
}

export async function deleteOrder(id: number): Promise<void> {
  await api.delete(`/orders/${id}`);
}

