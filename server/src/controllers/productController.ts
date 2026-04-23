import { Request, Response } from "express";

import * as productService from "../services/products/productService.js";
import * as productImageService from "../services/products/productImageService.js";
import * as productBulkService from "../services/products/productBulkService.js";
import * as productStatusService from "../services/products/productStatusService.js";
import { 
  GetProductsResponseDtoType, 
  GetProductsQueryParamsDtoType,
  CreateProductDtoType,
  UpdateProductDtoType,
  ProductIdParamDtoType
} from "../dtos/productDto.js";
import {
  CreateProductImagesDtoType,
  UpdateProductImageDtoType,
  ReorderProductImagesDtoType,
  ProductImageIdParamDtoType,
} from "../dtos/productImageDto.js";
import {
  BulkCreateProductsDtoType,
  BulkUpdateProductsDtoType,
  BulkDeleteProductsDtoType,
} from "../dtos/productBulkDto.js";
import {
  AddProductStatusDtoType,
  ProductStatusParamDtoType,
} from "../dtos/productStatusDto.js";
import { logger } from "../utils/logger.js";

async function getProducts(req: Request, res: Response) {
    logger.info("getProducts request", {
        query: req.query,
        validatedQuery: res.locals.query,
        path: req.path,
        originalUrl: req.originalUrl,
    });
    const query = res.locals.query as GetProductsQueryParamsDtoType;
    const result = await productService.getProducts(query);
    logger.info("getProducts success", {
        total: result.total,
        count: result.products.length,
    });
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

// Product Image Management
async function addProductImages(req: Request, res: Response) {
    const params = res.locals.params as ProductIdParamDtoType;
    const body = res.locals.body as CreateProductImagesDtoType;
    const result = await productImageService.addProductImages(params.id, body.images);
    res.status(201).json(result);
}

async function updateProductImage(req: Request, res: Response) {
    const params = res.locals.params as ProductImageIdParamDtoType;
    const body = res.locals.body as UpdateProductImageDtoType;
    const result = await productImageService.updateProductImage(
        params.productId,
        params.imageId,
        body
    );
    res.json(result);
}

async function deleteProductImage(req: Request, res: Response) {
    const params = res.locals.params as ProductImageIdParamDtoType;
    const result = await productImageService.deleteProductImage(params.productId, params.imageId);
    res.json(result);
}

async function reorderProductImages(req: Request, res: Response) {
    const params = res.locals.params as ProductIdParamDtoType;
    const body = res.locals.body as ReorderProductImagesDtoType;
    const result = await productImageService.reorderProductImages(params.id, body.imageIds);
    res.json(result);
}

// Bulk Operations
async function bulkCreateProducts(req: Request, res: Response) {
    const body = res.locals.body as BulkCreateProductsDtoType;
    const result = await productBulkService.bulkCreateProducts(body);
    res.status(201).json(result);
}

async function bulkUpdateProducts(req: Request, res: Response) {
    const body = res.locals.body as BulkUpdateProductsDtoType;
    const result = await productBulkService.bulkUpdateProducts(body);
    res.json(result);
}

async function bulkDeleteProducts(req: Request, res: Response) {
    const body = res.locals.body as BulkDeleteProductsDtoType;
    const result = await productBulkService.bulkDeleteProducts(body);
    res.json(result);
}

// Status Management
async function addProductStatus(req: Request, res: Response) {
    const params = res.locals.params as ProductIdParamDtoType;
    const body = res.locals.body as AddProductStatusDtoType;
    const result = await productStatusService.addProductStatus(params.id, body.status);
    res.status(201).json(result);
}

async function removeProductStatus(req: Request, res: Response) {
    const params = res.locals.params as ProductStatusParamDtoType;
    const result = await productStatusService.removeProductStatus(params.productId, params.status);
    res.json(result);
}

export default {
    getProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    getCategories,
    addProductImages,
    updateProductImage,
    deleteProductImage,
    reorderProductImages,
    bulkCreateProducts,
    bulkUpdateProducts,
    bulkDeleteProducts,
    addProductStatus,
    removeProductStatus,
};
