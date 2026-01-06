import { Router } from "express";
import manufacturerController from "../controllers/manufacturerController";
import { validateRequestBody, validateRequestParams } from "../middleware/validate";
import { optionalAuthenticate } from "../middleware/auth";
import { authenticate } from "../middleware/auth";
import { authorize } from "../middleware/authorize";
import {
  CreateManufacturerDto,
  UpdateManufacturerDto,
  ManufacturerIdParamDto,
} from "../dtos/manufacturerDto";

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

