import { z } from "zod";

/**
 * DTO for creating a new admin/superadmin user
 */
export const CreateUserDto = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
  fullName: z.string().optional(),
  role: z.enum(["admin", "superadmin"], {
    errorMap: () => ({ message: "Role must be 'admin' or 'superadmin'" }),
  }),
});

export type CreateUserDtoType = z.infer<typeof CreateUserDto>;

/**
 * DTO for user creation response
 */
export const CreateUserResponseDto = z.object({
  id: z.number().int().positive(),
  email: z.string().email(),
  fullName: z.string().nullable(),
  role: z.string(),
  cognitoSub: z.string(),
});

export type CreateUserResponseDtoType = z.infer<typeof CreateUserResponseDto>;

export const UpdateUserRoleDto = z.object({
  role: z.enum(["admin", "superadmin"], {
    errorMap: () => ({ message: "Role must be 'admin' or 'superadmin'" }),
  }),
});

export type UpdateUserRoleDtoType = z.infer<typeof UpdateUserRoleDto>;

export const UserIdParamDto = z.object({
  id: z.coerce.number().int().positive(),
});

export type UserIdParamDtoType = z.infer<typeof UserIdParamDto>;

export const UserListItemDto = z.object({
  id: z.number().int().positive(),
  email: z.string().email(),
  fullName: z.string().nullable(),
  cognitoSub: z.string(),
  role: z.enum(["customer", "admin", "superadmin"]),
  orderCount: z.number().int().nonnegative(),
  totalItemsOrdered: z.number().int().nonnegative(),
  createdAt: z.string(),
});

export type UserListItemDtoType = z.infer<typeof UserListItemDto>;
