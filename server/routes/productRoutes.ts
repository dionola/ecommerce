import { Router } from "express";
import productController from "../controllers/productController";
import { validateRequestQuery, validateRequestBody, validateRequestParams } from "../middleware/validate";
import { authenticate, optionalAuthenticate } from "../middleware/auth";
import { authorize } from "../middleware/authorize";
import { 
  GetProductsQueryParamsDto, 
  CreateProductDto,
  UpdateProductDto,
  ProductIdParamDto
} from "../dtos/productDto";

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

export default router;
