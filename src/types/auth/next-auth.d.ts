import type { AppRole } from "@/types/auth";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role: AppRole;
    restaurantId?: string | null;
    rememberMe?: boolean;
  }

  interface Session {
    user: {
      id: string;
      role: AppRole;
      restaurantId: string | null;
    } & DefaultSession["user"];
    rememberMe?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: AppRole;
    restaurantId?: string | null;
    rememberMe?: boolean;
    maxAge?: number;
  }
}
