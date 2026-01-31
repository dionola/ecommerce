import { Request, Response } from "express";

import * as promoService from "../services/promos/promoService";
import { 
  GetPromosResponseDtoType, 
  GetPromosQueryParamsDtoType,
  CreatePromoDtoType,
  UpdatePromoDtoType,
  PromoIdParamDtoType
} from "../dtos/promoDto";

async function getPromos(req: Request, res: Response) {
    const query = res.locals.query as GetPromosQueryParamsDtoType;
    const result = await promoService.getPromos(query);
    res.json(result);
}

async function getPromoById(req: Request, res: Response) {
    const params = res.locals.params as PromoIdParamDtoType;
    const result = await promoService.getPromoById(params.id);
    res.json(result);
}

async function createPromo(req: Request, res: Response) {
    const body = res.locals.body as CreatePromoDtoType;
    const result = await promoService.createPromo(body);
    res.status(201).json(result);
}

async function updatePromo(req: Request, res: Response) {
    const params = res.locals.params as PromoIdParamDtoType;
    const body = res.locals.body as UpdatePromoDtoType;
    const result = await promoService.updatePromo(params.id, body);
    res.json(result);
}

async function deletePromo(req: Request, res: Response) {
    const params = res.locals.params as PromoIdParamDtoType;
    await promoService.deletePromo(params.id);
    res.status(204).send();
}

export default { getPromos, getPromoById, createPromo, updatePromo, deletePromo };










