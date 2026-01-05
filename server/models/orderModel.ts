export interface Order {
  id: number;
  user_id: number;
  total_amount: number;
  status: string;
  promo_id: number | null;
  stripe_payment_intent_id: string | null;
  shipping_address: Record<string, any> | null;
  created_at: Date;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  price_at_purchase: number;
}



