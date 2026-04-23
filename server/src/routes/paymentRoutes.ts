import { Router } from "express";
import paymentController from "../controllers/paymentController.js";
import { validateRequestBody } from "../middleware/validate.js";
import { authenticate } from "../middleware/auth.js";
import {
  CreateCheckoutSessionDto,
} from "../dtos/paymentDto.js";

const router = Router();

// Checkout Session routes
router.post(
  "/checkout-session",
  authenticate,
  validateRequestBody(CreateCheckoutSessionDto),
  paymentController.createCheckoutSession
);

router.get(
  "/checkout-session/:sessionId/verify",
  authenticate,
  paymentController.verifyCheckoutSession
);

export default router;
