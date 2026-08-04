import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "@/lib/auth/auth.config";
import { loginSchema } from "@/lib/validations/auth";
import type { AppRole } from "@/types/auth";

function getDemoUser() {
  const email =
    process.env.AUTH_DEMO_EMAIL?.trim().toLowerCase() ||
    "admin@dineflow.local";
  const password = process.env.AUTH_DEMO_PASSWORD || "Demo@12345";
  const role = (process.env.AUTH_DEMO_ROLE as AppRole | undefined) || "manager";

  return {
    id: "demo-user",
    email,
    password,
    name: "Alex Doe",
    role,
    restaurantId:
      process.env.AUTH_DEMO_RESTAURANT_ID || "67a000000000000000000001",
  };
}

/**
 * Auth.js (NextAuth v5) entrypoint for DineFlow.
 * Credentials provider authenticates against env demo user for foundation use.
 * OAuth providers and MongoDB adapter are prepared as future extensions.
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

        // Rate-limiting placeholder — evaluate authSecurityConfig.rateLimiting later

        const demo = getDemoUser();
        const email = parsed.data.email.trim().toLowerCase();

        if (email !== demo.email || parsed.data.password !== demo.password) {
          // Audit-log placeholder: login_failed
          return null;
        }

        // Audit-log placeholder: login
        return {
          id: demo.id,
          email: demo.email,
          name: demo.name,
          role: demo.role,
          restaurantId: demo.restaurantId,
          rememberMe: parsed.data.rememberMe,
        };
      },
    }),
    /**
     * Future OAuth providers (Google / Microsoft) — enable via authSecurityConfig.oauth
     * when credentials and consent screens are configured.
     */
  ],
});
