import { Router, Request, Response } from "express";
import { query } from "../models/databaseModel.js";

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

router.get("/db", async (_req: Request, res: Response) => {
  const result = await query("SELECT current_database() AS database, current_user AS user_name");

  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    database: result.rows[0]?.database,
    user: result.rows[0]?.user_name,
  });
});

export default router;
