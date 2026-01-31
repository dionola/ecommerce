import { api } from './api';

export type Promo = {
    id: number;
    code: string;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    active_until: string | null;
};

/**
 * Validate a promo code by checking if it exists and is active
 * Returns the promo if valid, throws error if invalid
 */
export async function validatePromoCode(code: string): Promise<Promo> {
    // Get all active promos and filter for exact match (since backend uses ILIKE partial match)
    const response = await api.get<Promo[]>(`/promos?active=true&limit=100`);

    if (!response.data || response.data.length === 0) {
        throw new Error(`Promo code "${code}" not found or expired`);
    }

    // Find exact match (case-insensitive)
    const promo = response.data.find(p => p.code.toUpperCase() === code.toUpperCase());

    if (!promo) {
        throw new Error(`Promo code "${code}" not found or expired`);
    }

    return promo;
}

/**
 * Calculate discount amount for a promo code given a subtotal
 */
export function calculateDiscount(promo: Promo, subtotal: number): number {
    if (promo.discount_type === 'percentage') {
        return subtotal * (promo.discount_value / 100);
    } else {
        return promo.discount_value;
    }
}

