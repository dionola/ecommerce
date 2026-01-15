import { Router } from "express";
import bannerController from "../controllers/bannerController";
import { validateRequestBody } from "../middleware/validate";
import { authenticate } from "../middleware/auth";
import { authorize } from "../middleware/authorize";
import { UpdateBannerDto } from "../dtos/bannerDto";

const router = Router();

// Public endpoint to get banner
router.get(
  "/",
  bannerController.getBanner
);

// Admin-only endpoint to update banner
router.patch(
  "/",
  authenticate,
  authorize("admin", "superadmin"),
  validateRequestBody(UpdateBannerDto),
  bannerController.updateBanner
);

export default router;


