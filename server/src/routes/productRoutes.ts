import { Router } from "express";
import productController from "../controllers/productController.js";
import { validateRequestQuery, validateRequestBody, validateRequestParams } from "../middleware/validate.js";
import { authenticate, optionalAuthenticate } from "../middleware/auth.js";
import { authorize } from "../middleware/authorize.js";
import { 
  GetProductsQueryParamsDto, 
  CreateProductDto,
  UpdateProductDto,
  ProductIdParamDto
} from "../dtos/productDto.js";
import {
  CreateProductImagesDto,
  UpdateProductImageDto,
  ReorderProductImagesDto,
  ProductImageIdParamDto,
} from "../dtos/productImageDto.js";
import {
  BulkCreateProductsDto,
  BulkUpdateProductsDto,
  BulkDeleteProductsDto,
} from "../dtos/productBulkDto.js";
import {
  AddProductStatusDto,
  ProductStatusParamDto,
} from "../dtos/productStatusDto.js";

const router = Router();

router.get(
  "/",
  optionalAuthenticate,
  validateRequestQuery(GetProductsQueryParamsDto),
  productController.getProducts
);

router.get(
  "/categories",
  optionalAuthenticate,
  productController.getCategories
);

router.get(
  "/:id",
  optionalAuthenticate,
  validateRequestParams(ProductIdParamDto),
  productController.getProduct
);

router.post(
  "/",
  authenticate,
  authorize("admin", "superadmin"),
  validateRequestBody(CreateProductDto),
  productController.createProduct
);

router.patch(
  "/:id",
  authenticate,
  authorize("admin", "superadmin"),
  validateRequestParams(ProductIdParamDto),
  validateRequestBody(UpdateProductDto),
  productController.updateProduct
);

router.delete(
  "/:id",
  authenticate,
  authorize("admin", "superadmin"),
  validateRequestParams(ProductIdParamDto),
  productController.deleteProduct
);

// Product Image Management (Admin-only)
router.post(
  "/:id/images",
  authenticate,
  authorize("admin", "superadmin"),
  validateRequestParams(ProductIdParamDto),
  validateRequestBody(CreateProductImagesDto),
  productController.addProductImages
);

router.patch(
  "/:productId/images/:imageId",
  authenticate,
  authorize("admin", "superadmin"),
  validateRequestParams(ProductImageIdParamDto),
  validateRequestBody(UpdateProductImageDto),
  productController.updateProductImage
);

router.delete(
  "/:productId/images/:imageId",
  authenticate,
  authorize("admin", "superadmin"),
  validateRequestParams(ProductImageIdParamDto),
  productController.deleteProductImage
);

router.put(
  "/:id/images/reorder",
  authenticate,
  authorize("admin", "superadmin"),
  validateRequestParams(ProductIdParamDto),
  validateRequestBody(ReorderProductImagesDto),
  productController.reorderProductImages
);

// Bulk Operations (Admin-only)
router.post(
  "/bulk",
  authenticate,
  authorize("admin", "superadmin"),
  validateRequestBody(BulkCreateProductsDto),
  productController.bulkCreateProducts
);

router.patch(
  "/bulk",
  authenticate,
  authorize("admin", "superadmin"),
  validateRequestBody(BulkUpdateProductsDto),
  productController.bulkUpdateProducts
);

router.delete(
  "/bulk",
  authenticate,
  authorize("admin", "superadmin"),
  validateRequestBody(BulkDeleteProductsDto),
  productController.bulkDeleteProducts
);

// Status Management (Admin-only)
router.post(
  "/:id/statuses",
  authenticate,
  authorize("admin", "superadmin"),
  validateRequestParams(ProductIdParamDto),
  validateRequestBody(AddProductStatusDto),
  productController.addProductStatus
);

router.delete(
  "/:productId/statuses/:status",
  authenticate,
  authorize("admin", "superadmin"),
  validateRequestParams(ProductStatusParamDto),
  productController.removeProductStatus
);

export default router;
