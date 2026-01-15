import { Router } from "express";
import paymentController from "../controllers/paymentController";
import { validateRequestBody, validateRequestParams, validateRequestQuery } from "../middleware/validate";
import { authenticate } from "../middleware/auth";
import {
  CreatePaymentIntentDto,
  ConfirmPaymentDto,
  RefundPaymentDto,
  PaymentIntentIdParamDto,
} from "../dtos/paymentDto";

const router = Router();

router.post(
  "/intents",
  authenticate,
  validateRequestBody(CreatePaymentIntentDto),
  paymentController.createPaymentIntent
);

router.post(
  "/confirm",
  authenticate,
  validateRequestBody(ConfirmPaymentDto),
  paymentController.confirmPayment
);

router.get(
  "/intents/:paymentIntentId",
  authenticate,
  validateRequestParams(PaymentIntentIdParamDto),
  paymentController.getPaymentIntentStatus
);

router.delete(
  "/intents/:paymentIntentId",
  authenticate,
  validateRequestParams(PaymentIntentIdParamDto),
  paymentController.cancelPaymentIntent
);

router.post(
  "/refund",
  authenticate,
  validateRequestBody(RefundPaymentDto),
  paymentController.refundPayment
);

export default router;





