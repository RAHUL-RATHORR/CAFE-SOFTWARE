import { cn } from "@/lib/utils";

type FormErrorMessageProps = {
  message?: string;
  className?: string;
};

export function FormErrorMessage({ message, className }: FormErrorMessageProps) {
  if (!message) return null;

  return (
    <p role="alert" className={cn("text-xs font-medium text-destructive", className)}>
      {message}
    </p>
  );
}
