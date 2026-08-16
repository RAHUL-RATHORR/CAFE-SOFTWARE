import Link from "next/link";
import { AppCard } from "@/components/cards/app-card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type OrderUnavailableViewProps = {
  title: string;
  description: string;
};

export function OrderUnavailableView({
  title,
  description,
}: OrderUnavailableViewProps) {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg items-center px-4 py-16">
      <AppCard className="w-full space-y-4 p-6 text-center">
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
        <Link href="/" className={cn(buttonVariants(), "rounded-xl")}>
          Go home
        </Link>
      </AppCard>
    </main>
  );
}
