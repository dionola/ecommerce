import { Router } from "express";
import paymentController from "../controllers/paymentController";
import { validateRequestBody } from "../middleware/validate";
import { authenticate } from "../middleware/auth";
import {
  CreateCheckoutSessionDto,
} from "../dtos/paymentDto";

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
