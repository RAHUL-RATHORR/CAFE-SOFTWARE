import { z } from "zod";
import { emailValidator, passwordValidator } from "@/lib/validations/validators";

export const loginSchema = z.object({
  email: emailValidator,
  password: z
    .string()
    .min(1, "Password is required")
    .max(72, "Password must be 72 characters or less"),
  rememberMe: z.boolean().catch(false),
});

export const forgotPasswordSchema = z.object({
  email: emailValidator,
});

export const resetPasswordSchema = z
  .object({
    password: passwordValidator,
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

/** Change-password validation placeholder — no UI/API wired yet */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    password: passwordValidator,
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((values) => values.password !== values.currentPassword, {
    message: "New password must be different from the current password",
    path: ["password"],
  });

export type LoginSchema = z.infer<typeof loginSchema>;
export type ForgotPasswordSchema = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordSchema = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordSchema = z.infer<typeof changePasswordSchema>;
