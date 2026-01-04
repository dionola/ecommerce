export interface Promo {
  id: number;
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  active_until: Date | null;
}

