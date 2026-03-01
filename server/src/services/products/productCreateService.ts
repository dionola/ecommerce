import { query } from "../../models/databaseModel";
import { ProductDtoType, CreateProductDtoType } from "../../dtos/productDto";
import { fetchProductWithImages } from "./productHelpers";

interface ProductInsertParams {
  params: any[];
}

function buildProductInsertParams(data: CreateProductDtoType): ProductInsertParams {
  return {
    params: [
      data.name,
      data.description ?? null,
      data.base_price,
      data.country_of_origin ?? null,
      data.stock_quantity ?? 0,
      data.manufacturer_id ?? null,
    ],
  };
}

interface ImageInsertData {
  query: string;
  params: any[];
}

function buildImageInsertQuery(productId: number, images: Array<{ url: string; is_main?: boolean }>): ImageInsertData | null {
  if (!images || images.length === 0) {
    return null;
  }

  const imageValues = images.map((img, index) => {
    const baseIndex = index * 3;
    return `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3})`;
  }).join(", ");

  const query = `
    INSERT INTO product_images (product_id, url, is_main)
    VALUES ${imageValues}
  `;

  const params: any[] = [];
  images.forEach((img) => {
    params.push(productId, img.url, img.is_main ?? false);
  });

  return { query, params };
}

async function insertProduct(data: CreateProductDtoType): Promise<number> {
  const insertProductQuery = `
    INSERT INTO products (name, description, base_price, country_of_origin, stock_quantity, manufacturer_id)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id
  `;

  const { params } = buildProductInsertParams(data);
  const result = await query(insertProductQuery, params);
  
  return result.rows[0].id;
}

async function insertProductImages(productId: number, images: Array<{ url: string; is_main?: boolean }>): Promise<void> {
  const imageInsertData = buildImageInsertQuery(productId, images);
  
  if (imageInsertData) {
    await query(imageInsertData.query, imageInsertData.params);
  }
}

export async function createProduct(data: CreateProductDtoType): Promise<ProductDtoType> {
  const productId = await insertProduct(data);
  await insertProductImages(productId, data.images ?? []);
  return fetchProductWithImages(productId);
}

