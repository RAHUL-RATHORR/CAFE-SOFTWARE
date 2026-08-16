"use client";

import {
  BaseModal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "@/components/modals/base-modal";
import { Button } from "@/components/ui/button";
import { QrCodeCanvas } from "@/components/qr-code/qr-code-canvas";

type QrPreviewModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  url?: string;
  onDownload?: () => void;
  onPrint?: () => void;
};

export function QrPreviewModal({
  open,
  onOpenChange,
  title = "QR preview",
  url,
  onDownload,
  onPrint,
}: QrPreviewModalProps) {
  return (
    <BaseModal open={open} onOpenChange={onOpenChange} size="md">
      <ModalHeader>
        <h2 className="text-base font-semibold">{title}</h2>
        {url ? (
          <p className="mt-1 break-all text-xs text-muted-foreground">{url}</p>
        ) : null}
      </ModalHeader>
      <ModalBody className="flex flex-col items-center gap-4">
        {url ? <QrCodeCanvas value={url} size={240} /> : null}
      </ModalBody>
      <ModalFooter>
        <Button
          type="button"
          variant="outline"
          className="rounded-xl"
          onClick={() => onOpenChange(false)}
        >
          Close
        </Button>
        {onPrint ? (
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            onClick={onPrint}
          >
            Print
          </Button>
        ) : null}
        {onDownload ? (
          <Button type="button" className="rounded-xl" onClick={onDownload}>
            Download PNG
          </Button>
        ) : null}
      </ModalFooter>
    </BaseModal>
  );
}
