"use client";

import { RestaurantAvatar } from "@/components/avatar/avatar";
import { cn } from "@/lib/utils";

type BranchAvatarProps = {
  name: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
};

export function BranchAvatar({
  name,
  size = "md",
  className,
}: BranchAvatarProps) {
  return (
    <RestaurantAvatar
      name={name}
      size={size}
      className={cn("rounded-xl", className)}
    />
  );
}
