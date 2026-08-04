"use client";

import type { ReactNode } from "react";
import {
  BaseModal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "@/components/modals/base-modal";
import type { ModalSize } from "@/types";

type SizedModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
};

function SizedModal({
  size,
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
}: SizedModalProps & { size: ModalSize }) {
  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      size={size}
      className={className}
      aria-label={title}
    >
      <ModalHeader>
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </ModalHeader>
      <ModalBody className={size === "full" ? "flex-1 overflow-auto" : undefined}>
        {children}
      </ModalBody>
      {footer ? <ModalFooter>{footer}</ModalFooter> : null}
    </BaseModal>
  );
}

export function SmallModal(props: SizedModalProps) {
  return <SizedModal {...props} size="sm" />;
}

export function MediumModal(props: SizedModalProps) {
  return <SizedModal {...props} size="md" />;
}

export function LargeModal(props: SizedModalProps) {
  return <SizedModal {...props} size="lg" />;
}

export function FullscreenModal(props: SizedModalProps) {
  return <SizedModal {...props} size="full" />;
}

export function FormModal(props: SizedModalProps) {
  return <SizedModal {...props} size="lg" />;
}

export function DetailsModal(props: SizedModalProps) {
  return <SizedModal {...props} size="md" />;
}
