"use client";

import { useEffect } from "react";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

/**
 * Route-level error boundary for the App Router.
 * Keeps layout chrome intact where nested under a parent layout.
 */
export default function GlobalRouteError({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error("[DineFlow] route error", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold tracking-tight">
          Something went wrong
        </h2>
        <p className="max-w-md text-sm text-muted-foreground">
          We couldn&apos;t render this page. You can try again, or navigate back
          to another section.
        </p>
        {error.digest ? (
          <p className="font-mono text-xs text-muted-foreground">
            Ref: {error.digest}
          </p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={reset}
        className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Try again
      </button>
    </div>
  );
}
