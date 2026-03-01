import { query } from "../../models/databaseModel";

export async function getCategories(): Promise<string[]> {
  const categoriesQuery = `
    SELECT DISTINCT category
    FROM products
    WHERE category IS NOT NULL AND category != ''
    ORDER BY category ASC
  `;

  const result = await query(categoriesQuery, []);
  return result.rows.map(row => row.category);
}

