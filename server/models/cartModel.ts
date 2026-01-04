export interface Cart {
  id: number;
  user_id: number;
  updated_at: Date;
}

export interface CartItem {
  id: number;
  cart_id: number;
  product_id: number;
  quantity: number;
}

