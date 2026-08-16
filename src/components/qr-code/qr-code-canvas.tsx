"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { cn } from "@/lib/utils";

type QrCodeCanvasProps = {
  value: string;
  size?: number;
  className?: string;
  onReady?: (dataUrl: string) => void;
};

export function QrCodeCanvas({
  value,
  size = 220,
  className,
  onReady,
}: QrCodeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !value) return;

    let cancelled = false;
    setError(null);

    QRCode.toCanvas(canvas, value, {
      width: size,
      margin: 2,
      color: { dark: "#111111", light: "#ffffff" },
    })
      .then(() => {
        if (cancelled) return;
        onReady?.(canvas.toDataURL("image/png"));
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to render QR");
      });

    return () => {
      cancelled = true;
    };
  }, [value, size, onReady]);

  if (!value) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground",
          className
        )}
        style={{ width: size, height: size }}
      >
        No QR URL
      </div>
    );
  }

  return (
    <div className={cn("inline-flex flex-col items-center gap-2", className)}>
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="rounded-xl border bg-white p-2"
      />
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
