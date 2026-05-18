import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.js";

import * as orderService from "../services/orders/orderService.js";
import { 
  GetOrdersResponseDtoType,
  GetOrdersQueryParamsDtoType,
  CreateOrderDtoType,
  UpdateOrderDtoType,
  OrderIdParamDtoType
} from "../dtos/orderDto.js";

function assertUser(req: AuthenticatedRequest, res: Response): req is AuthenticatedRequest & { user: NonNullable<AuthenticatedRequest["user"]> & { email: string } } {
    if (!req.user?.sub || !req.user.email) {
        res.status(401).json({ message: "Unauthorized" });
        return false;
    }

    return true;
}

async function getOrders(req: AuthenticatedRequest, res: Response) {
    if (!assertUser(req, res)) return;
    
    const query = res.locals.query as GetOrdersQueryParamsDtoType;
    
    // Get or create user ID in database
    const { getOrCreateUser } = await import("../services/users/userService.js");
    const userId = await getOrCreateUser(req.user.sub, req.user.email);
    
    // Check if user is admin (can see all orders)
    const isAdmin = req.user["cognito:groups"]?.includes("admin") || req.user["cognito:groups"]?.includes("superadmin");
    
    // If admin and explicitly requesting another user's orders, allow it
    // Otherwise, scope to current user
    const userIdForQuery = (isAdmin && query.user_id) ? undefined : userId;
    
    const result = await orderService.getOrders(query, userIdForQuery);
    res.json(result);
}

async function getOrderById(req: AuthenticatedRequest, res: Response) {
    if (!assertUser(req, res)) return;
    
    const params = res.locals.params as OrderIdParamDtoType;
    
    // Get or create user ID in database
    const { getOrCreateUser } = await import("../services/users/userService.js");
    const userId = await getOrCreateUser(req.user.sub, req.user.email);
    
    // Check if user is admin (can see any order)
    const isAdmin = req.user["cognito:groups"]?.includes("admin") || req.user["cognito:groups"]?.includes("superadmin");
    
    const result = await orderService.getOrderById(params.id, isAdmin ? undefined : userId);
    res.json(result);
}

async function createOrder(req: AuthenticatedRequest, res: Response) {
    try {
        if (!req.user?.sub || !req.user?.email) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const body = res.locals.body as CreateOrderDtoType;
        const result = await orderService.createOrder(req.user.sub, req.user.email, body);
        res.status(201).json(result);
    } catch (error: any) {
        // Log the error with full details
        const { logger } = await import("../utils/logger.js");
        logger.error("Error in createOrder controller:", {
            message: error?.message,
            stack: error?.stack,
            error: error,
            body: req.body,
            user: req.user?.sub,
        });
        throw error; // Re-throw to let error handler handle it
    }
}

async function updateOrder(req: AuthenticatedRequest, res: Response) {
    if (!assertUser(req, res)) return;
    
    const params = res.locals.params as OrderIdParamDtoType;
    const body = res.locals.body as UpdateOrderDtoType;
    
    // Get or create user ID in database
    const { getOrCreateUser } = await import("../services/users/userService.js");
    const userId = await getOrCreateUser(req.user.sub, req.user.email);
    
    // Check if user is admin (can update any order)
    const isAdmin = req.user["cognito:groups"]?.includes("admin") || req.user["cognito:groups"]?.includes("superadmin");
    
    const result = await orderService.updateOrder(params.id, body, isAdmin ? undefined : userId);
    res.json(result);
}

async function deleteOrder(req: AuthenticatedRequest, res: Response) {
    if (!req.user?.sub) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }
    const params = res.locals.params as OrderIdParamDtoType;
    
    // Admin-only: Only pending orders can be deleted
    await orderService.deleteOrder(params.id);
    res.status(204).send();
}

export default { getOrders, getOrderById, createOrder, updateOrder, deleteOrder };


