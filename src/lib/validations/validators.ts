import { z } from "zod";

export const requiredString = (message = "This field is required") =>
  z.string().trim().min(1, message);

export const nameValidator = requiredString("Name is required").max(
  120,
  "Name must be 120 characters or less"
);

export const descriptionValidator = z
  .string()
  .trim()
  .max(500, "Description must be 500 characters or less")
  .optional()
  .or(z.literal(""));

export const emailValidator = z.email("Enter a valid email address");

export const phoneValidator = z
  .string()
  .trim()
  .min(7, "Enter a valid phone number")
  .max(20, "Phone number is too long")
  .regex(/^[+]?[\d\s()-]+$/, "Enter a valid phone number");

export const urlValidator = z.url("Enter a valid URL");

export const optionalUrlValidator = z
  .string()
  .trim()
  .url("Enter a valid URL")
  .optional()
  .or(z.literal(""));

export const passwordValidator = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be 72 characters or less")
  .regex(/[A-Za-z]/, "Password must include a letter")
  .regex(/[0-9]/, "Password must include a number");

export const slugValidator = z
  .string()
  .trim()
  .min(1, "Slug is required")
  .max(120, "Slug must be 120 characters or less")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens");

export const numberValidator = z.coerce
  .number({ error: "Enter a valid number" })
  .finite("Enter a valid number");

export const currencyValidator = z.coerce
  .number({ error: "Enter a valid amount" })
  .min(0, "Amount cannot be negative")
  .finite("Enter a valid amount");

export const priceValidator = currencyValidator;

export const quantityValidator = z.coerce
  .number({ error: "Enter a valid quantity" })
  .int("Quantity must be a whole number")
  .min(0, "Quantity cannot be negative");

export const percentageValidator = z.coerce
  .number({ error: "Enter a valid percentage" })
  .min(0, "Percentage cannot be less than 0")
  .max(100, "Percentage cannot be more than 100");

export const validators = {
  requiredString,
  name: nameValidator,
  description: descriptionValidator,
  email: emailValidator,
  phone: phoneValidator,
  url: urlValidator,
  optionalUrl: optionalUrlValidator,
  password: passwordValidator,
  slug: slugValidator,
  number: numberValidator,
  currency: currencyValidator,
  price: priceValidator,
  quantity: quantityValidator,
  percentage: percentageValidator,
} as const;
