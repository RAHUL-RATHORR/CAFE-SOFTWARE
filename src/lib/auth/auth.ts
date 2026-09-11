import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { authConfig } from "@/lib/auth/auth.config";
import { loginSchema } from "@/lib/validations/auth";
import { connectToDatabase } from "@/lib/database/connection";
import { UserModel } from "@/models/user";

/**
 * Auth.js (NextAuth v5) entrypoint for DineFlow.
 * Credentials provider authenticates against MongoDB.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      id: "credentials",
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        rememberMe: { label: "Remember Me", type: "text" },
      },
      async authorize(credentials) {
        const emailValue = Array.isArray(credentials?.email)
          ? credentials.email[0]
          : credentials?.email;
        const passwordValue = Array.isArray(credentials?.password)
          ? credentials.password[0]
          : credentials?.password;
        const rememberRaw = Array.isArray(credentials?.rememberMe)
          ? credentials.rememberMe[0]
          : credentials?.rememberMe;

        const parsed = loginSchema.safeParse({
          email: typeof emailValue === "string" ? emailValue : "",
          password: typeof passwordValue === "string" ? passwordValue : "",
          rememberMe:
            rememberRaw === true ||
            rememberRaw === "true" ||
            rememberRaw === "on" ||
            rememberRaw === "1",
        });

        if (!parsed.success) {
          return null;
        }

        const email = parsed.data.email.trim().toLowerCase();

        // Local development demo fallback for instant offline/local testing
        const isDemoLoginEnabled = process.env.NODE_ENV === "development" || process.env.ENABLE_DEMO_LOGIN === "true";
        if (isDemoLoginEnabled && parsed.data.password === "Demo@12345") {
          const demoRoles: Record<string, { role: any; name: string }> = {
            "admin@dineflow.local": { role: "super-admin", name: "Super Admin (Demo)" },
            "owner@dineflow.local": { role: "restaurant-owner", name: "Restaurant Owner (Demo)" },
            "manager@dineflow.local": { role: "manager", name: "Manager (Demo)" },
            "cashier@dineflow.local": { role: "cashier", name: "Cashier (Demo)" },
            "kitchen@dineflow.local": { role: "kitchen", name: "Kitchen Staff (Demo)" },
          };

          if (demoRoles[email]) {
            return {
              id: `demo-${demoRoles[email].role}-id`,
              email,
              name: demoRoles[email].name,
              role: demoRoles[email].role as any,
              restaurantId: "650000000000000000000001",
              mustChangePassword: false,
              rememberMe: parsed.data.rememberMe,
            };
          }
        }

        try {
          await connectToDatabase();

          const user = await UserModel.findOne({ email }).lean();

          if (!user || !user.password) {
            return null;
          }
          
          if (user.status === "suspended" || user.isDeleted) {
             return null;
          }

          const isPasswordValid = await bcrypt.compare(
            parsed.data.password,
            user.password
          );

          if (!isPasswordValid) {
            return null;
          }

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
            restaurantId: user.restaurantId?.toString() || null,
            mustChangePassword: user.mustChangePassword,
            rememberMe: parsed.data.rememberMe,
          };
        } catch (dbError) {
          console.warn("[Auth] Database connection failed during authorize:", dbError);
          return null;
        }
      },
    }),
  ],
});
