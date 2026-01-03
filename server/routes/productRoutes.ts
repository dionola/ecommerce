import { Router } from "express";
import productController from "../controllers/productController";
import { validateRequestQuery, validateRequestBody, validateRequestParams } from "../middleware/validate";
import { 
  GetProductsQueryParamsDto, 
  CreateProductDto,
  UpdateProductDto,
  ProductIdParamDto
} from "../dtos/productDto";

const router = Router();

router.get(
  "/",
  validateRequestQuery(GetProductsQueryParamsDto),
  productController.getProducts
);

router.post(
  "/",
  validateRequestBody(CreateProductDto),
  productController.createProduct
);

router.patch(
  "/:id",
  validateRequestParams(ProductIdParamDto),
  validateRequestBody(UpdateProductDto),
  productController.updateProduct
);

router.delete(
  "/:id",
  validateRequestParams(ProductIdParamDto),
  productController.deleteProduct
);

export default router;
