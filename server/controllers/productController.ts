import { Request, Response } from "express";

import * as productService from "../services/productService";
import { GetProductsResponseDtoType, GetProductsQueryParamsDtoType } from "../dtos/productDto";

async function getProducts(req: Request, res: Response) {
    const query = res.locals.query as GetProductsQueryParamsDtoType;
    const result = await productService.getProducts(query);
    res.json(result);
}

export default { getProducts };