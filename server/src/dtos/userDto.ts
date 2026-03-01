import { z } from "zod";

/**
 * DTO for creating a new admin/superadmin user
 */
export const CreateUserDto = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
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

