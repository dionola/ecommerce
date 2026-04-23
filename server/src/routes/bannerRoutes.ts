import { Router } from "express";
import bannerController from "../controllers/bannerController.js";
import { UpdateBannerDto } from "../dtos/bannerDto.js";
import { authenticate } from "../middleware/auth.js";
import { authorize } from "../middleware/authorize.js";
import { validateRequestBody } from "../middleware/validate.js";

const router = Router();

router.get("/", bannerController.getBanner);

router.patch(
  "/",
  authenticate,
  authorize("admin", "superadmin"),
  validateRequestBody(UpdateBannerDto),
  bannerController.updateBanner,
);

export default router;
