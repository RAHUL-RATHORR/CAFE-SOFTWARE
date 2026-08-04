"use client";

import { Play } from "lucide-react";
import {
  BaseModal,
  ModalBody,
  ModalHeader,
} from "@/components/modals/base-modal";

type ImagePreviewModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  src?: string;
  alt?: string;
  title?: string;
};

export function ImagePreviewModal({
  open,
  onOpenChange,
  src = "/next.svg",
  alt = "Preview image",
  title = "Image preview",
}: ImagePreviewModalProps) {
  return (
    <BaseModal open={open} onOpenChange={onOpenChange} size="xl" aria-label={title}>
      <ModalHeader>
        <h2 className="text-base font-semibold">{title}</h2>
      </ModalHeader>
      <ModalBody>
        <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-xl border border-border bg-muted/40">
          {/* Placeholder-friendly: next/image optional; use img for arbitrary URLs */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={alt} className="max-h-full max-w-full object-contain" />
        </div>
      </ModalBody>
    </BaseModal>
  );
}

type VideoPreviewModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
};

export function VideoPreviewModal({
  open,
  onOpenChange,
  title = "Video preview",
}: VideoPreviewModalProps) {
  return (
    <BaseModal open={open} onOpenChange={onOpenChange} size="xl" aria-label={title}>
      <ModalHeader>
        <h2 className="text-base font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Video player placeholder — no media playback wired
        </p>
      </ModalHeader>
      <ModalBody>
        <div className="flex aspect-video flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/30">
          <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Play className="size-6" aria-hidden />
          </div>
          <p className="text-sm font-medium">Video preview placeholder</p>
        </div>
      </ModalBody>
    </BaseModal>
  );
}
