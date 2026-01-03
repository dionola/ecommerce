import { Router } from "express";
import productController from "../controllers/productController";
import { validateRequestQuery } from "../middleware/validate";
import { GetProductsQueryParamsDto } from "../dtos/productDto";

const router = Router();

router.get(
  "/",
  validateRequestQuery(GetProductsQueryParamsDto),
  productController.getProducts
);

export default router;
