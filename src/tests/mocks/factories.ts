import { vi } from "vitest";
import {
  createTestOrder,
  createTestRestaurant,
  createTestUser,
  createTestCategory,
  createTestMenuItem,
  createTestCustomer,
} from "@/tests/fixtures";
import { mockSession } from "@/tests/helpers/session";
import { orderSuccess, orderFailure } from "@/lib/orders/result";

type AnyArgs = unknown[];

export function createRepositoryMocks() {
  return {
    restaurant: {
      findById: vi.fn(async (..._args: AnyArgs) =>
        createTestRestaurant({ id: String(_args[0] ?? "x") })
      ),
      findMany: vi.fn(async (..._args: AnyArgs) => ({
        items: [createTestRestaurant()],
        meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
      })),
    },
    category: {
      findMany: vi.fn(async (..._args: AnyArgs) => ({
        items: [createTestCategory()],
        meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
      })),
    },
    menuItem: {
      findMany: vi.fn(async (..._args: AnyArgs) => ({
        items: [createTestMenuItem()],
        meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
      })),
    },
    order: {
      create: vi.fn(async (..._args: AnyArgs) => createTestOrder()),
      findById: vi.fn(async (..._args: AnyArgs) =>
        createTestOrder({ id: String(_args[0] ?? "x") })
      ),
      findMany: vi.fn(async (..._args: AnyArgs) => ({
        items: [createTestOrder()],
        meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
      })),
    },
    customer: {
      findMany: vi.fn(async (..._args: AnyArgs) => ({
        items: [createTestCustomer()],
        meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
      })),
    },
  };
}

export function createServerActionMocks() {
  return {
    createOrder: vi.fn(async (..._args: AnyArgs) =>
      orderSuccess(createTestOrder())
    ),
    getOrders: vi.fn(async (..._args: AnyArgs) =>
      orderSuccess({ items: [createTestOrder()] })
    ),
    failOrder: vi.fn(async (..._args: AnyArgs) =>
      orderFailure("UNAUTHORIZED", "Not authorized")
    ),
  };
}

export function createAuthMocks(
  role: "manager" | "super-admin" | "cashier" = "manager"
) {
  const session = mockSession({ role });
  return {
    session,
    auth: vi.fn(async (..._args: AnyArgs) => session),
    requireAuth: vi.fn(async (..._args: AnyArgs) => session.user),
    signIn: vi.fn(async (..._args: AnyArgs) => ({ ok: true })),
    signOut: vi.fn(async (..._args: AnyArgs) => undefined),
  };
}

export function createNotificationMocks() {
  return {
    notify: vi.fn(async (..._args: AnyArgs) => ({ success: true })),
    list: vi.fn(async (..._args: AnyArgs) => ({ items: [], unreadCount: 0 })),
    markRead: vi.fn(async (..._args: AnyArgs) => ({ success: true })),
  };
}

export const mockAuthUser = createTestUser;
export const mockAuthSession = mockSession;
