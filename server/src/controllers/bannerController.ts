import { Request, Response } from "express";
import { UpdateBannerDtoType } from "../dtos/bannerDto";
import * as bannerService from "../services/bannerService";

async function getBanner(_req: Request, res: Response) {
  const result = await bannerService.getBanner();
  res.json(result);
}

async function updateBanner(_req: Request, res: Response) {
  const body = res.locals.body as UpdateBannerDtoType;
  const result = await bannerService.updateBanner(body);
  res.json(result);
}

export default {
  getBanner,
  updateBanner,
};
