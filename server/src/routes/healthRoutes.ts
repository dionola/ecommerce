import { Router, Request, Response } from "express";

const router = Router();

/**
 * GET /
 * Simple liveness probe for load balancers and orchestrators (mounted at /health).
 */
router.get("/", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

export default router;
