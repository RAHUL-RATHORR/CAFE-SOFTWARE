import type { AppNotification } from "@/types";

export const sampleNotifications: AppNotification[] = [
  {
    id: "n1",
    title: "New order received",
    description: "Order #1048 was placed for Table T-12.",
    category: "orders",
    createdAt: "2 min ago",
    read: false,
  },
  {
    id: "n2",
    title: "Kitchen ticket ready",
    description: "Order #1043 is ready for service.",
    category: "kitchen",
    createdAt: "8 min ago",
    read: false,
  },
  {
    id: "n3",
    title: "Invoice generated",
    description: "Billing draft for July is ready for review.",
    category: "billing",
    createdAt: "1 hr ago",
    read: true,
  },
  {
    id: "n4",
    title: "Customer feedback",
    description: "Ava Thompson left a 5-star review.",
    category: "customers",
    createdAt: "3 hr ago",
    read: true,
  },
  {
    id: "n5",
    title: "System maintenance",
    description: "Scheduled window tonight at 2:00 AM UTC.",
    category: "system",
    createdAt: "Yesterday",
    read: true,
  },
  {
    id: "n6",
    title: "Security alert",
    description: "New login from an unrecognized device (placeholder).",
    category: "security",
    createdAt: "Yesterday",
    read: false,
  },
];
