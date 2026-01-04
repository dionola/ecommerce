import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";

import * as orderService from "../services/orders/orderService";
import { 
  GetOrdersResponseDtoType,
  GetOrdersQueryParamsDtoType,
  CreateOrderDtoType,
  UpdateOrderDtoType,
  OrderIdParamDtoType
} from "../dtos/orderDto";

async function getOrders(req: AuthenticatedRequest, res: Response) {
    if (!req.user?.sub) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }
    
    const query = res.locals.query as GetOrdersQueryParamsDtoType;
    
    // Get user ID from database
    const { getUserIdByCognitoSub } = await import("../services/wishlists/wishlistHelpers");
    const userId = await getUserIdByCognitoSub(req.user.sub);
    
    // Check if user is admin (can see all orders)
    const isAdmin = req.user["cognito:groups"]?.includes("admin") || req.user["cognito:groups"]?.includes("superadmin");
    
    // If admin and explicitly requesting another user's orders, allow it
    // Otherwise, scope to current user
    const userIdForQuery = (isAdmin && query.user_id) ? undefined : userId;
    
    const result = await orderService.getOrders(query, userIdForQuery);
    res.json(result);
}

async function getOrderById(req: AuthenticatedRequest, res: Response) {
    if (!req.user?.sub) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }
    
    const params = res.locals.params as OrderIdParamDtoType;
    
    // Get user ID from database
    const { getUserIdByCognitoSub } = await import("../services/wishlists/wishlistHelpers");
    const userId = await getUserIdByCognitoSub(req.user.sub);
    
    // Check if user is admin (can see any order)
    const isAdmin = req.user["cognito:groups"]?.includes("admin") || req.user["cognito:groups"]?.includes("superadmin");
    
    const result = await orderService.getOrderById(params.id, isAdmin ? undefined : userId);
    res.json(result);
}

async function createOrder(req: AuthenticatedRequest, res: Response) {
    if (!req.user?.sub) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }
    const body = res.locals.body as CreateOrderDtoType;
    const result = await orderService.createOrder(req.user.sub, body);
    res.status(201).json(result);
}

async function updateOrder(req: AuthenticatedRequest, res: Response) {
    if (!req.user?.sub) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }
    
    const params = res.locals.params as OrderIdParamDtoType;
    const body = res.locals.body as UpdateOrderDtoType;
    
    // Get user ID from database
    const { getUserIdByCognitoSub } = await import("../services/wishlists/wishlistHelpers");
    const userId = await getUserIdByCognitoSub(req.user.sub);
    
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
    await orderService.deleteOrder(params.id);
    res.status(204).send();
}

export default { getOrders, getOrderById, createOrder, updateOrder, deleteOrder };

