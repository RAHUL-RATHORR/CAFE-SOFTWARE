import net from "net";
import type {
  PrinterConfig,
  PrintJobResult,
  ThermalPaperWidth,
} from "@/types/printer";
import type { EscPosBuilder } from "./escpos-builder";

// In-memory queue / debounce map to prevent double-printing within a short time window
const activeJobs = new Map<string, number>();

function isDebounced(key: string, cooldownMs = 2500): boolean {
  const lastTime = activeJobs.get(key);
  const now = Date.now();
  if (lastTime && now - lastTime < cooldownMs) {
    return true;
  }
  activeJobs.set(key, now);
  // Clean up old entries
  if (activeJobs.size > 100) {
    for (const [k, time] of activeJobs.entries()) {
      if (now - time > 10000) activeJobs.delete(k);
    }
  }
  return false;
}

export class PrinterService {
  /**
   * Send ESC/POS payload via TCP socket to a network thermal printer (Raw Port 9100)
   */
  static async sendNetworkPrintJob(
    address: string,
    port: number,
    buffer: Buffer,
    timeoutMs = 4000
  ): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve) => {
      const client = new net.Socket();
      let resolved = false;

      const finish = (success: boolean, error?: string) => {
        if (resolved) return;
        resolved = true;
        try {
          client.destroy();
        } catch {}
        resolve({ success, error });
      };

      client.setTimeout(timeoutMs);

      client.connect(port, address, () => {
        client.write(buffer, (err) => {
          if (err) {
            finish(false, `Socket write failed: ${err.message}`);
          } else {
            // Give printer a moment to buffer data before closing socket
            setTimeout(() => {
              client.end();
              finish(true);
            }, 250);
          }
        });
      });

      client.on("timeout", () => {
        finish(false, `Network connection timed out to ${address}:${port}`);
      });

      client.on("error", (err: Error) => {
        finish(false, `Network printer error (${address}:${port}): ${err.message}`);
      });
    });
  }

  /**
   * Send ESC/POS payload to local desktop hardware bridge daemon (USB / Serial)
   */
  static async sendBridgePrintJob(
    bridgeUrl: string,
    base64Payload: string,
    printerName: string,
    timeoutMs = 3000
  ): Promise<{ success: boolean; error?: string }> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const url = bridgeUrl.startsWith("http") ? bridgeUrl : `http://${bridgeUrl}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          printerName,
          payload: base64Payload,
        }),
        signal: controller.signal,
      });

      clearTimeout(timer);
      if (res.ok) {
        return { success: true };
      } else {
        return {
          success: false,
          error: `Print bridge responded with status ${res.status}: ${res.statusText}`,
        };
      }
    } catch (err: unknown) {
      clearTimeout(timer);
      const msg = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        error: `Local print bridge unreachable at ${bridgeUrl} (${msg}). Is the bridge daemon running?`,
      };
    }
  }

  /**
   * Test network printer connectivity (TCP probe)
   */
  static async testNetworkConnectivity(
    address: string,
    port: number,
    timeoutMs = 2500
  ): Promise<{ connected: boolean; error?: string }> {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      let resolved = false;

      const finish = (connected: boolean, error?: string) => {
        if (resolved) return;
        resolved = true;
        try {
          socket.destroy();
        } catch {}
        resolve({ connected, error });
      };

      socket.setTimeout(timeoutMs);

      socket.connect(port, address, () => {
        socket.end();
        finish(true);
      });

      socket.on("timeout", () => {
        finish(false, `Connection timeout to ${address}:${port}`);
      });

      socket.on("error", (err: Error) => {
        finish(false, err.message);
      });
    });
  }

  /**
   * Execute a print job for a given printer config and compiled ESC/POS builder.
   * Gracefully decouples: if hardware fails, returns FALLBACK_BROWSER with monospace preview.
   */
  static async executePrintJob(
    printer: PrinterConfig | null,
    builder: EscPosBuilder,
    debounceKey?: string
  ): Promise<PrintJobResult> {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const previewText = builder.toPreviewText();
    const rawPayloadBase64 = builder.toBase64();
    const rawBuffer = builder.toBuffer();
    const paperWidth: ThermalPaperWidth = printer?.paperWidth || "80mm";
    const printerName = printer?.name || "Browser Thermal Fallback";

    // Debounce check to prevent multi-click duplicates
    if (debounceKey && isDebounced(debounceKey)) {
      return {
        success: true,
        jobId,
        status: "QUEUED",
        transport: printer?.connectionType === "usb" ? "bridge" : "network",
        printerName,
        paperWidth,
        previewText,
        rawPayloadBase64,
      };
    }

    // If no physical printer configured, use browser fallback
    if (!printer || !printer.isActive) {
      return {
        success: true,
        jobId,
        status: "FALLBACK_BROWSER",
        transport: "browser",
        printerName: "Browser Thermal Print",
        paperWidth,
        previewText,
        rawPayloadBase64,
      };
    }

    // Dispatch based on connection type
    if (printer.connectionType === "network") {
      const netResult = await this.sendNetworkPrintJob(
        printer.address,
        printer.port || 9100,
        rawBuffer
      );

      if (netResult.success) {
        return {
          success: true,
          jobId,
          status: "PRINTED",
          transport: "network",
          printerName: printer.name,
          paperWidth,
          previewText,
          rawPayloadBase64,
        };
      } else {
        // Fallback to browser receipt preview without crashing order/billing
        return {
          success: false,
          jobId,
          status: "FALLBACK_BROWSER",
          transport: "browser",
          printerName: printer.name,
          paperWidth,
          previewText,
          rawPayloadBase64,
          error: netResult.error,
        };
      }
    } else if (printer.connectionType === "usb") {
      // Local USB print bridge (defaulting to address or localhost:9095)
      const bridgeAddress = printer.address || "127.0.0.1:9095/print";
      const bridgeResult = await this.sendBridgePrintJob(
        bridgeAddress,
        rawPayloadBase64,
        printer.name
      );

      if (bridgeResult.success) {
        return {
          success: true,
          jobId,
          status: "PRINTED",
          transport: "bridge",
          printerName: printer.name,
          paperWidth,
          previewText,
          rawPayloadBase64,
        };
      } else {
        return {
          success: false,
          jobId,
          status: "FALLBACK_BROWSER",
          transport: "browser",
          printerName: printer.name,
          paperWidth,
          previewText,
          rawPayloadBase64,
          error: bridgeResult.error,
        };
      }
    } else {
      // Bluetooth or unsupported direct in Node environment -> Browser fallback
      return {
        success: true,
        jobId,
        status: "FALLBACK_BROWSER",
        transport: "browser",
        printerName: printer.name,
        paperWidth,
        previewText,
        rawPayloadBase64,
      };
    }
  }
}
