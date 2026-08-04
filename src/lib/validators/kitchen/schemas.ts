import { z } from "zod";
import {
  ORDER_PRIORITIES,
  ORDER_STATUSES,
  ORDER_TYPES,
} from "@/types/order";

export const searchKitchenSchema = z.object({
  q: z.string().trim().max(120).optional().or(z.literal("")),
  status: z.enum(["all", ...ORDER_STATUSES]).default("all"),
  orderType: z.enum(["all", ...ORDER_TYPES]).default("all"),
  priority: z.enum(["all", ...ORDER_PRIORITIES]).default("all"),
  tableId: z.string().trim().optional().or(z.literal("")),
  assignedChefId: z.string().trim().optional().or(z.literal("")),
  view: z.enum(["board", "queue"]).default("board"),
});

export const updateKitchenStatusSchema = z.object({
  id: z.string().trim().min(1, "Order id is required"),
  status: z.enum(ORDER_STATUSES),
  note: z.string().trim().max(255).optional().or(z.literal("")),
});

export const updateKitchenPrioritySchema = z.object({
  id: z.string().trim().min(1, "Order id is required"),
  priority: z.enum(ORDER_PRIORITIES),
});

export const completeKitchenOrderSchema = z.object({
  id: z.string().trim().min(1, "Order id is required"),
});

export type SearchKitchenInput = z.infer<typeof searchKitchenSchema>;
export type UpdateKitchenStatusInput = z.infer<typeof updateKitchenStatusSchema>;
export type UpdateKitchenPriorityInput = z.infer<
  typeof updateKitchenPrioritySchema
>;
export type CompleteKitchenOrderInput = z.infer<
  typeof completeKitchenOrderSchema
>;
