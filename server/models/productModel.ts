export interface Product {
  id: number;
  name: string;
  description: string | null;
  base_price: number;
  country_of_origin: string | null;
  stock_quantity: number;
  manufacturer_id: number | null;
  created_at: Date;
}