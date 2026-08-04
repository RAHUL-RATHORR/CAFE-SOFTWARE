"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { OptimizedImage } from "@/components/media/optimized-image";

export const avatarVariants = cva(
  "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted font-medium text-muted-foreground",
  {
    variants: {
      size: {
        xs: "size-6 text-[10px]",
        sm: "size-8 text-xs",
        md: "size-10 text-sm",
        lg: "size-12 text-base",
        xl: "size-14 text-lg",
        "2xl": "size-16 text-xl",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

export type AvatarSize = NonNullable<VariantProps<typeof avatarVariants>["size"]>;

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

type AvatarProps = {
  src?: string;
  alt?: string;
  name?: string;
  size?: AvatarSize;
  className?: string;
  status?: "online" | "offline" | "busy" | "away";
};

const statusColor = {
  online: "bg-success",
  offline: "bg-muted-foreground",
  busy: "bg-destructive",
  away: "bg-warning",
} as const;

const AVATAR_PX: Record<AvatarSize, number> = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 48,
  xl: 56,
  "2xl": 64,
};

export function Avatar({
  src,
  alt,
  name = "User",
  size = "md",
  className,
  status,
}: AvatarProps) {
  const px = AVATAR_PX[size];

  return (
    <span className={cn(avatarVariants({ size }), className)}>
      {src ? (
        <OptimizedImage
          src={src}
          alt={alt ?? name}
          width={px}
          height={px}
          sizes={`${px}px`}
          className="size-full object-cover"
        />
      ) : (
        <span aria-hidden>{getInitials(name)}</span>
      )}
      {status ? (
        <span
          className={cn(
            "absolute right-0 bottom-0 size-2.5 rounded-full ring-2 ring-background",
            statusColor[status],
            (size === "xs" || size === "sm") && "size-2"
          )}
          aria-label={status}
        />
      ) : null}
    </span>
  );
}

export function UserAvatar(props: AvatarProps) {
  return <Avatar {...props} />;
}

export function RestaurantAvatar({
  name = "Restaurant",
  ...props
}: AvatarProps) {
  return (
    <Avatar
      {...props}
      name={name}
      className={cn("rounded-xl bg-primary/10 text-primary", props.className)}
    />
  );
}

type AvatarStackProps = {
  items: Array<{ name: string; src?: string }>;
  size?: AvatarSize;
  max?: number;
  className?: string;
};

export function AvatarStack({
  items,
  size = "sm",
  max = 4,
  className,
}: AvatarStackProps) {
  const visible = items.slice(0, max);
  const overflow = Math.max(0, items.length - max);

  return (
    <div className={cn("flex items-center -space-x-2", className)}>
      {visible.map((item, index) => (
        <Avatar
          key={`${item.name}-${index}`}
          name={item.name}
          src={item.src}
          size={size}
          className="ring-2 ring-background"
        />
      ))}
      {overflow > 0 ? (
        <span
          className={cn(
            avatarVariants({ size }),
            "ring-2 ring-background"
          )}
        >
          +{overflow}
        </span>
      ) : null}
    </div>
  );
}

export function GroupAvatar(props: AvatarStackProps) {
  return <AvatarStack {...props} />;
}
