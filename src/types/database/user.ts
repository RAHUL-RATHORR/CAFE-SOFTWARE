import type {
  BaseDocumentFields,
  DatabaseUserRole,
  TenantScoped,
  UserStatus,
} from "@/types/database";
import type { UserInput } from "@/lib/validators";

export type User = Omit<UserInput, "restaurantId" | "password"> &
  BaseDocumentFields &
  Partial<TenantScoped> & {
    restaurantId: string | null;
    /** Placeholder hash/plaintext field — auth not implemented here */
    password?: string;
    role: DatabaseUserRole;
    status: UserStatus;
  };
