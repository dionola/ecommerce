import { Request, Response } from "express";

import * as productService from "../services/products/productService";
import { 
  GetProductsResponseDtoType, 
  GetProductsQueryParamsDtoType,
  CreateProductDtoType,
  UpdateProductDtoType,
  ProductIdParamDtoType
} from "../dtos/productDto";

async function getProducts(req: Request, res: Response) {
    const query = res.locals.query as GetProductsQueryParamsDtoType;
    const result = await productService.getProducts(query);
    res.json(result);
}

async function getProduct(req: Request, res: Response) {
    const params = res.locals.params as ProductIdParamDtoType;
    const result = await productService.getProduct(params.id);
    res.json(result);
}

async function createProduct(req: Request, res: Response) {
    const body = res.locals.body as CreateProductDtoType;
    const result = await productService.createProduct(body);
    res.status(201).json(result);
}

async function updateProduct(req: Request, res: Response) {
    const params = res.locals.params as ProductIdParamDtoType;
    const body = res.locals.body as UpdateProductDtoType;
    const result = await productService.updateProduct(params.id, body);
    res.json(result);
}

async function deleteProduct(req: Request, res: Response) {
    const params = res.locals.params as ProductIdParamDtoType;
    await productService.deleteProduct(params.id);
    res.status(204).send();
}

async function getCategories(req: Request, res: Response) {
    const categories = await productService.getCategories();
    res.json(categories);
}

export default { getProducts, getProduct, createProduct, updateProduct, deleteProduct, getCategories };