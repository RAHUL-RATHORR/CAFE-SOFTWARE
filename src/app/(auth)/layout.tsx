import type { ReactNode } from "react";
import Link from "next/link";
import { Utensils } from "lucide-react";
import { siteConfig } from "@/config/site";
import { requireGuest } from "@/lib/auth/session";

type AuthLayoutProps = {
  children: ReactNode;
};

export default async function AuthLayout({ children }: AuthLayoutProps) {
  await requireGuest();

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-primary lg:flex lg:flex-col lg:justify-between lg:p-10">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.35), transparent 45%), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.2), transparent 40%)",
          }}
          aria-hidden
        />
        <Link href="/login" className="relative flex items-center gap-3 text-primary-foreground">
          <div className="flex size-10 items-center justify-center rounded-xl bg-white/15">
            <Utensils className="size-5" aria-hidden />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-tight">{siteConfig.name}</p>
            <p className="text-xs text-primary-foreground/80">Restaurant Suite</p>
          </div>
        </Link>

        <div className="relative space-y-3 text-primary-foreground">
          <h1 className="max-w-md text-3xl font-semibold tracking-tight">
            Run every service from one workspace.
          </h1>
          <p className="max-w-md text-sm text-primary-foreground/80">
            Sign in to manage floors, kitchens, and billing across your
            restaurants.
          </p>
        </div>

        <p className="relative text-xs text-primary-foreground/70">
          Multi-tenant authentication foundation
        </p>
      </aside>

      <main className="flex flex-col justify-center px-4 py-10 sm:px-8">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Utensils className="size-4" aria-hidden />
            </div>
            <div>
              <p className="text-sm font-semibold">{siteConfig.name}</p>
              <p className="text-xs text-muted-foreground">Restaurant Suite</p>
            </div>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
