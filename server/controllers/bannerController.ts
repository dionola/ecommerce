import { Request, Response } from "express";
import * as bannerService from "../services/banner/bannerService";
import { UpdateBannerDtoType } from "../dtos/bannerDto";

async function getBanner(req: Request, res: Response) {
    try {
        const banner = await bannerService.getBanner();
        res.json(banner);
    } catch (error: any) {
        const { logger } = await import("../utils/logger");
        logger.error("Error in getBanner controller:", error);
        // Return default banner on error
        res.json({
            id: 0,
            title: "The Art of Living Well",
            description: "A curated selection of home essentials designed for longevity, utility, and aesthetic permanence.",
            image_url: "https://image.hm.com/assets/hm/1a/3c/1a3c77208f05c2cf02bbdd5d0d71016abcd23548.jpg?imwidth=2160",
            category: null,
            button_text: "View Collection — 2026",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        });
    }
}

async function updateBanner(req: Request, res: Response) {
    const body = res.locals.body as UpdateBannerDtoType;
    const result = await bannerService.updateBanner(body);
    res.json(result);
}

export default {
    getBanner,
    updateBanner,
};

