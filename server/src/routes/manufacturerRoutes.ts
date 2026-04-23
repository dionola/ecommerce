import { Router } from "express";
import manufacturerController from "../controllers/manufacturerController.js";
import { validateRequestBody, validateRequestParams } from "../middleware/validate.js";
import { optionalAuthenticate } from "../middleware/auth.js";
import { authenticate } from "../middleware/auth.js";
import { authorize } from "../middleware/authorize.js";
import {
  CreateManufacturerDto,
  UpdateManufacturerDto,
  ManufacturerIdParamDto,
} from "../dtos/manufacturerDto.js";

const router = Router();

/**
 * List manufacturers (public)
 */
router.get(
  "/",
  optionalAuthenticate,
  manufacturerController.getManufacturers
);

/**
 * Get manufacturer by ID (public)
 */
router.get(
  "/:id",
  optionalAuthenticate,
  validateRequestParams(ManufacturerIdParamDto),
  manufacturerController.getManufacturerById
);

/**
 * Create manufacturer (admin-only)
 */
router.post(
  "/",
  authenticate,
  authorize("admin", "superadmin"),
  validateRequestBody(CreateManufacturerDto),
  manufacturerController.createManufacturer
);

/**
 * Update manufacturer (admin-only)
 */
router.patch(
  "/:id",
  authenticate,
  authorize("admin", "superadmin"),
  validateRequestParams(ManufacturerIdParamDto),
  validateRequestBody(UpdateManufacturerDto),
  manufacturerController.updateManufacturer
);

/**
 * Delete manufacturer (admin-only)
 */
router.delete(
  "/:id",
  authenticate,
  authorize("admin", "superadmin"),
  validateRequestParams(ManufacturerIdParamDto),
  manufacturerController.deleteManufacturer
);

export default router;

