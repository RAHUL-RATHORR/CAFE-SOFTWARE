import type { AppRole } from "@/types/navigation";

export const testIds = {
  restaurantId: "507f1f77bcf86cd799439011",
  branchId: "507f1f77bcf86cd799439012",
  userId: "507f1f77bcf86cd799439013",
  customerId: "507f1f77bcf86cd799439014",
  categoryId: "507f1f77bcf86cd799439015",
  menuItemId: "507f1f77bcf86cd799439016",
  orderId: "507f1f77bcf86cd799439017",
  invoiceId: "507f1f77bcf86cd799439018",
  inventoryId: "507f1f77bcf86cd799439019",
  purchaseId: "507f1f77bcf86cd79943901a",
  employeeId: "507f1f77bcf86cd79943901b",
} as const;

export function createTestRestaurant(
  overrides: Partial<{
    id: string;
    name: string;
    slug: string;
    email: string;
    currency: string;
    timezone: string;
  }> = {}
) {
  return {
    id: testIds.restaurantId,
    name: "DineFlow Demo Cafe",
    slug: "dineflow-demo",
    email: "owner@dineflow.local",
    currency: "INR",
    timezone: "Asia/Kolkata",
    ...overrides,
  };
}

export function createTestBranch(
  overrides: Partial<{
    id: string;
    restaurantId: string;
    name: string;
    code: string;
    isActive: boolean;
  }> = {}
) {
  return {
    id: testIds.branchId,
    restaurantId: testIds.restaurantId,
    name: "Main Branch",
    code: "MAIN",
    isActive: true,
    ...overrides,
  };
}

export function createTestUser(
  overrides: Partial<{
    id: string;
    email: string;
    name: string;
    role: AppRole;
    restaurantId: string | null;
    image?: string | null;
  }> = {}
) {
  return {
    id: testIds.userId,
    email: "manager@dineflow.local",
    name: "Demo Manager",
    role: "manager" as AppRole,
    restaurantId: testIds.restaurantId,
    image: null,
    ...overrides,
  };
}

export function createTestCustomer(
  overrides: Partial<{
    id: string;
    restaurantId: string;
    name: string;
    email: string;
    phone: string;
  }> = {}
) {
  return {
    id: testIds.customerId,
    restaurantId: testIds.restaurantId,
    name: "Walk-in Guest",
    email: "guest@example.com",
    phone: "+91 90000 00000",
    ...overrides,
  };
}

export function createTestCategory(
  overrides: Partial<{
    id: string;
    restaurantId: string;
    name: string;
    slug: string;
    isActive: boolean;
  }> = {}
) {
  return {
    id: testIds.categoryId,
    restaurantId: testIds.restaurantId,
    name: "Beverages",
    slug: "beverages",
    isActive: true,
    ...overrides,
  };
}

export function createTestMenuItem(
  overrides: Partial<{
    id: string;
    restaurantId: string;
    categoryId: string;
    name: string;
    price: number;
    isVeg: boolean;
    isAvailable: boolean;
  }> = {}
) {
  return {
    id: testIds.menuItemId,
    restaurantId: testIds.restaurantId,
    categoryId: testIds.categoryId,
    name: "Masala Chai",
    price: 80,
    isVeg: true,
    isAvailable: true,
    ...overrides,
  };
}

export function createTestOrder(
  overrides: Partial<{
    id: string;
    restaurantId: string;
    branchId: string | null;
    status: string;
    orderType: string;
    subtotal: number;
    tax: number;
    grandTotal: number;
    items: Array<{
      menuItemId: string;
      name: string;
      price: number;
      quantity: number;
    }>;
  }> = {}
) {
  const items = overrides.items ?? [
    {
      menuItemId: testIds.menuItemId,
      name: "Masala Chai",
      price: 80,
      quantity: 2,
    },
  ];
  const subtotal =
    overrides.subtotal ??
    items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = overrides.tax ?? Math.round(subtotal * 0.05 * 100) / 100;
  return {
    id: testIds.orderId,
    restaurantId: testIds.restaurantId,
    branchId: testIds.branchId,
    status: "pending",
    orderType: "dine-in",
    subtotal,
    tax,
    grandTotal: overrides.grandTotal ?? subtotal + tax,
    items,
    ...overrides,
  };
}

export function createTestInvoice(
  overrides: Partial<{
    id: string;
    orderId: string;
    restaurantId: string;
    status: string;
    grandTotal: number;
  }> = {}
) {
  return {
    id: testIds.invoiceId,
    orderId: testIds.orderId,
    restaurantId: testIds.restaurantId,
    status: "unpaid",
    grandTotal: 168,
    ...overrides,
  };
}

export function createTestInventoryItem(
  overrides: Partial<{
    id: string;
    restaurantId: string;
    name: string;
    sku: string;
    quantity: number;
    unit: string;
  }> = {}
) {
  return {
    id: testIds.inventoryId,
    restaurantId: testIds.restaurantId,
    name: "Tea Leaves",
    sku: "TEA-001",
    quantity: 25,
    unit: "kg",
    ...overrides,
  };
}

export function createTestPurchase(
  overrides: Partial<{
    id: string;
    restaurantId: string;
    vendorName: string;
    status: string;
    grandTotal: number;
  }> = {}
) {
  return {
    id: testIds.purchaseId,
    restaurantId: testIds.restaurantId,
    vendorName: "Fresh Supplies Co",
    status: "draft",
    grandTotal: 2500,
    ...overrides,
  };
}

export function createTestEmployee(
  overrides: Partial<{
    id: string;
    restaurantId: string;
    name: string;
    email: string;
    role: AppRole;
    department: string;
  }> = {}
) {
  return {
    id: testIds.employeeId,
    restaurantId: testIds.restaurantId,
    name: "Kitchen Chef",
    email: "chef@dineflow.local",
    role: "chef" as AppRole,
    department: "kitchen",
    ...overrides,
  };
}
