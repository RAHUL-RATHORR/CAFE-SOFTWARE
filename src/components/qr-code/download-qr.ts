"use client";

import QRCode from "qrcode";

export async function downloadQrPng(input: {
  url: string;
  filename: string;
  size?: number;
}) {
  const dataUrl = await QRCode.toDataURL(input.url, {
    width: input.size ?? 512,
    margin: 2,
    color: { dark: "#111111", light: "#ffffff" },
  });

  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = input.filename.endsWith(".png")
    ? input.filename
    : `${input.filename}.png`;
  document.body.appendChild(link);
  link.click();
  link.remove();
}
