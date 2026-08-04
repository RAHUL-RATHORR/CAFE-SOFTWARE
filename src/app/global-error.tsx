"use client";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

/**
 * Root error boundary — replaces the root layout when it fails.
 */
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-background px-6 font-sans text-foreground">
        <div className="max-w-md space-y-4 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Application error
          </h1>
          <p className="text-sm text-muted-foreground">
            DineFlow hit an unexpected failure. Retry to reload the application
            shell.
          </p>
          {error.digest ? (
            <p className="font-mono text-xs text-muted-foreground">
              Ref: {error.digest}
            </p>
          ) : null}
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-card px-4 text-sm font-medium"
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
