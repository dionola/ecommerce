import { Router } from "express";
import bannerController from "../controllers/bannerController";
import { UpdateBannerDto } from "../dtos/bannerDto";
import { authenticate } from "../middleware/auth";
import { authorize } from "../middleware/authorize";
import { validateRequestBody } from "../middleware/validate";

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
