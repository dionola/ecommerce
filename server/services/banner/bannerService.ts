import { query } from "../../models/databaseModel";
import { BannerDto, BannerDtoType, UpdateBannerDtoType, validateDto } from "../../dtos/bannerDto";
import { NotFoundError } from "../../errors/NotFoundError";

export async function getBanner(): Promise<BannerDtoType> {
  try {
    const bannerQuery = `
      SELECT id, title, description, image_url, category, button_text, created_at, updated_at
      FROM banner_config
      ORDER BY id DESC
      LIMIT 1
    `;

    const result = await query(bannerQuery, []);

    if (result.rows.length === 0) {
      // Return default banner if none exists
      return {
        id: 0,
        title: "The Art of Living Well",
        description: "A curated selection of home essentials designed for longevity, utility, and aesthetic permanence.",
        image_url: "https://image.hm.com/assets/hm/1a/3c/1a3c77208f05c2cf02bbdd5d0d71016abcd23548.jpg?imwidth=2160",
        category: null,
        button_text: "View Collection — 2026",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    // Convert timestamps to strings
    const row = result.rows[0];
    
    // Helper to convert timestamp to ISO string
    const toISOString = (value: any): string => {
      if (value instanceof Date) {
        return value.toISOString();
      }
      if (typeof value === 'string') {
        return value;
      }
      if (value) {
        return new Date(value).toISOString();
      }
      return new Date().toISOString();
    };
    
    const bannerData = {
      id: Number(row.id),
      title: String(row.title || ''),
      description: String(row.description || ''),
      image_url: String(row.image_url || ''),
      category: row.category ? String(row.category) : null,
      button_text: row.button_text ? String(row.button_text) : null,
      created_at: toISOString(row.created_at),
      updated_at: toISOString(row.updated_at),
    };

    return validateDto(BannerDto, bannerData, "Failed to validate banner data");
  } catch (error: any) {
    // If table doesn't exist or other DB error, return default banner
    const { logger } = await import("../../utils/logger");
    logger.error("Error fetching banner, returning default:", error);
    
    return {
      id: 0,
      title: "The Art of Living Well",
      description: "A curated selection of home essentials designed for longevity, utility, and aesthetic permanence.",
      image_url: "https://image.hm.com/assets/hm/1a/3c/1a3c77208f05c2cf02bbdd5d0d71016abcd23548.jpg?imwidth=2160",
      category: null,
      button_text: "View Collection — 2026",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }
}

export async function updateBanner(data: UpdateBannerDtoType): Promise<BannerDtoType> {
  // Get existing banner or create new one
  const existingBanner = await getBanner();

  const updateFields: string[] = [];
  const updateValues: any[] = [];
  let paramIndex = 1;

  if (data.title !== undefined) {
    updateFields.push(`title = $${paramIndex++}`);
    updateValues.push(data.title);
  }
  if (data.description !== undefined) {
    updateFields.push(`description = $${paramIndex++}`);
    updateValues.push(data.description);
  }
  if (data.image_url !== undefined) {
    updateFields.push(`image_url = $${paramIndex++}`);
    updateValues.push(data.image_url);
  }
  if (data.category !== undefined) {
    updateFields.push(`category = $${paramIndex++}`);
    updateValues.push(data.category);
  }
  if (data.button_text !== undefined) {
    updateFields.push(`button_text = $${paramIndex++}`);
    updateValues.push(data.button_text);
  }

  if (updateFields.length === 0) {
    return existingBanner;
  }

  updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

  if (existingBanner.id === 0) {
    // Create new banner
    const insertQuery = `
      INSERT INTO banner_config (title, description, image_url, category, button_text)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, title, description, image_url, category, button_text, created_at, updated_at
    `;
    const result = await query(insertQuery, [
      data.title || existingBanner.title,
      data.description || existingBanner.description,
      data.image_url || existingBanner.image_url,
      data.category !== undefined ? data.category : existingBanner.category,
      data.button_text !== undefined ? data.button_text : existingBanner.button_text,
    ]);
    
    // Convert timestamps to strings
    const bannerData = {
      ...result.rows[0],
      created_at: result.rows[0].created_at instanceof Date 
        ? result.rows[0].created_at.toISOString() 
        : result.rows[0].created_at,
      updated_at: result.rows[0].updated_at instanceof Date 
        ? result.rows[0].updated_at.toISOString() 
        : result.rows[0].updated_at,
    };
    
    return validateDto(BannerDto, bannerData, "Failed to validate banner data");
  } else {
    // Update existing banner
    updateValues.push(existingBanner.id);
    const updateQuery = `
      UPDATE banner_config
      SET ${updateFields.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING id, title, description, image_url, category, button_text, created_at, updated_at
    `;
    const result = await query(updateQuery, updateValues);
    
    if (result.rows.length === 0) {
      throw new NotFoundError("Banner not found");
    }
    
    // Convert timestamps to strings
    const bannerData = {
      ...result.rows[0],
      created_at: result.rows[0].created_at instanceof Date 
        ? result.rows[0].created_at.toISOString() 
        : result.rows[0].created_at,
      updated_at: result.rows[0].updated_at instanceof Date 
        ? result.rows[0].updated_at.toISOString() 
        : result.rows[0].updated_at,
    };
    
    return validateDto(BannerDto, bannerData, "Failed to validate banner data");
  }
}

