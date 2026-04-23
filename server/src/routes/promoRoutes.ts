import { Router } from "express";
import promoController from "../controllers/promoController.js";
import { validateRequestQuery, validateRequestBody, validateRequestParams } from "../middleware/validate.js";
import { optionalAuthenticate } from "../middleware/auth.js";
import { authenticate } from "../middleware/auth.js";
import { authorize } from "../middleware/authorize.js";
import {
  GetPromosQueryParamsDto,
  CreatePromoDto,
  UpdatePromoDto,
  PromoIdParamDto,
} from "../dtos/promoDto.js";

const router = Router();

/**
 * List promos (public)
 */
router.get(
  "/",
  optionalAuthenticate,
  validateRequestQuery(GetPromosQueryParamsDto),
  promoController.getPromos
);

/**
 * Get promo by ID (public)
 */
router.get(
  "/:id",
  optionalAuthenticate,
  validateRequestParams(PromoIdParamDto),
  promoController.getPromoById
);

/**
 * Create promo (admin-only)
 */
router.post(
  "/",
  authenticate,
  authorize("admin", "superadmin"),
  validateRequestBody(CreatePromoDto),
  promoController.createPromo
);

/**
 * Update promo (admin-only)
 */
router.patch(
  "/:id",
  authenticate,
  authorize("admin", "superadmin"),
  validateRequestParams(PromoIdParamDto),
  validateRequestBody(UpdatePromoDto),
  promoController.updatePromo
);

/**
 * Delete promo (admin-only)
 */
router.delete(
  "/:id",
  authenticate,
  authorize("admin", "superadmin"),
  validateRequestParams(PromoIdParamDto),
  promoController.deletePromo
);

export default router;

