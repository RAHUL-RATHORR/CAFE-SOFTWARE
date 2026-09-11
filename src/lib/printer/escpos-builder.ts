/**
 * ESC/POS Command Builder & Monospace Preview Generator
 *
 * Implements standard ESC/POS binary protocol byte generation for thermal printers
 * (58mm / 80mm) and provides synchronized plaintext monospace preview rendering.
 */

export type Alignment = "left" | "center" | "right";
export type TextSize = "normal" | "double-height" | "double-width" | "double-both";

export interface EscPosOptions {
  characterWidth?: number; // 32 for 58mm, 42 or 48 for 80mm
}

export class EscPosBuilder {
  private chunks: Buffer[] = [];
  private previewLines: string[] = [];
  private characterWidth: number;
  private currentAlign: Alignment = "left";
  private isBold = false;
  private currentSize: TextSize = "normal";

  constructor(options: EscPosOptions = {}) {
    this.characterWidth = options.characterWidth || 48;
    this.initialize();
  }

  /**
   * Reset printer to default state: ESC @ (0x1B, 0x40)
   */
  initialize(): this {
    this.chunks.push(Buffer.from([0x1b, 0x40]));
    return this;
  }

  /**
   * Set text alignment: ESC a n (0x1B, 0x61, n)
   * 0: Left, 1: Center, 2: Right
   */
  align(alignment: Alignment): this {
    this.currentAlign = alignment;
    const n = alignment === "center" ? 0x01 : alignment === "right" ? 0x02 : 0x00;
    this.chunks.push(Buffer.from([0x1b, 0x61, n]));
    return this;
  }

  /**
   * Set bold mode: ESC E n (0x1B, 0x45, n)
   */
  bold(enable = true): this {
    this.isBold = enable;
    this.chunks.push(Buffer.from([0x1b, 0x45, enable ? 0x01 : 0x00]));
    return this;
  }

  /**
   * Set text sizing: GS ! n (0x1D, 0x21, n)
   */
  size(textSize: TextSize): this {
    this.currentSize = textSize;
    let n = 0x00;
    if (textSize === "double-height") n = 0x01;
    else if (textSize === "double-width") n = 0x10;
    else if (textSize === "double-both") n = 0x11;

    this.chunks.push(Buffer.from([0x1d, 0x21, n]));
    return this;
  }

  /**
   * Append raw text followed by newline (or inline)
   */
  text(str: string, newline = true): this {
    const cleanStr = (str || "").replace(/[\r]/g, "");
    if (cleanStr.length > 0) {
      // ESC/POS uses CP437 or ASCII for basic characters
      this.chunks.push(Buffer.from(cleanStr, "latin1"));
    }
    if (newline) {
      this.chunks.push(Buffer.from([0x0a]));
      this.addPreviewLine(cleanStr);
    }
    return this;
  }

  /**
   * Add empty lines / feed: ESC d n (0x1B, 0x64, n)
   */
  feed(lines = 1): this {
    const count = Math.max(1, Math.min(lines, 10));
    this.chunks.push(Buffer.from([0x1b, 0x64, count]));
    for (let i = 0; i < count; i++) {
      this.previewLines.push("");
    }
    return this;
  }

  /**
   * Print a horizontal separator line (e.g. '----------------' or '================')
   */
  separator(char = "-"): this {
    const line = char.repeat(this.characterWidth);
    this.align("left");
    this.chunks.push(Buffer.from(line + "\n", "latin1"));
    this.previewLines.push(line);
    return this;
  }

  /**
   * Two column line: left text + right text, padded with spaces to fill characterWidth
   * Example: "Subtotal                       ₹ 450.00"
   */
  twoColumns(left: string, right: string): this {
    const maxLen = this.characterWidth;
    const l = (left || "").trim();
    const r = (right || "").trim();

    const availableSpace = maxLen - r.length;
    if (availableSpace < 4) {
      // Too tight: print left then right on next line
      this.text(l);
      this.align("right").text(r).align("left");
      return this;
    }

    let line = "";
    if (l.length > availableSpace - 1) {
      // Truncate or wrap left side
      const truncated = l.substring(0, availableSpace - 1);
      const spaces = " ".repeat(Math.max(1, maxLen - truncated.length - r.length));
      line = truncated + spaces + r;
    } else {
      const spaces = " ".repeat(Math.max(1, maxLen - l.length - r.length));
      line = l + spaces + r;
    }

    this.align("left");
    this.chunks.push(Buffer.from(line + "\n", "latin1"));
    this.previewLines.push(line);
    return this;
  }

  /**
   * Three column line: Qty, Item Name, Price / Amount
   * Properly wraps item name across multiple lines if it overflows.
   */
  itemLine(
    qty: number | string,
    name: string,
    price: string,
    rate?: string
  ): this {
    const qtyStr = String(qty).padEnd(4, " ");
    const priceStr = price.padStart(9, " ");
    // Format: QTY(4) + NAME(var) + PRICE(9)
    const nameMaxLen = this.characterWidth - qtyStr.length - priceStr.length;

    const words = (name || "").split(" ");
    const lines: string[] = [];
    let currentLine = "";

    for (const word of words) {
      if ((currentLine + (currentLine ? " " : "") + word).length <= nameMaxLen) {
        currentLine += (currentLine ? " " : "") + word;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word.substring(0, nameMaxLen);
      }
    }
    if (currentLine) lines.push(currentLine);
    if (lines.length === 0) lines.push("");

    // First line has Qty and Price
    const firstLineName = lines[0].padEnd(nameMaxLen, " ");
    const fullFirstLine = `${qtyStr}${firstLineName}${priceStr}`;
    this.align("left");
    this.chunks.push(Buffer.from(fullFirstLine + "\n", "latin1"));
    this.previewLines.push(fullFirstLine);

    // Subsequent lines for wrapped name
    for (let i = 1; i < lines.length; i++) {
      const continuation = "    " + lines[i]; // indent under item name
      this.chunks.push(Buffer.from(continuation + "\n", "latin1"));
      this.previewLines.push(continuation);
    }

    // Optional unit rate line
    if (rate) {
      const rateLine = `    @ ${rate}`;
      this.chunks.push(Buffer.from(rateLine + "\n", "latin1"));
      this.previewLines.push(rateLine);
    }

    return this;
  }

  /**
   * Add modifier / addon / note indented under item
   */
  itemNote(note: string): this {
    const indented = `  * ${note}`.substring(0, this.characterWidth);
    this.align("left");
    this.chunks.push(Buffer.from(indented + "\n", "latin1"));
    this.previewLines.push(indented);
    return this;
  }

  /**
   * Cut paper: GS V 66 0 (0x1D, 0x56, 0x42, 0x00)
   */
  cut(feedLines = 3): this {
    this.feed(feedLines);
    this.chunks.push(Buffer.from([0x1d, 0x56, 0x42, 0x00]));
    this.previewLines.push("[=== PAPER CUT ===]");
    return this;
  }

  /**
   * Open Cash Drawer: ESC p 0 25 250 (0x1B, 0x70, 0x00, 0x19, 0xFA)
   * Sends 50ms pulse to pin 2 of RJ11 connector
   */
  cashDrawer(): this {
    this.chunks.push(Buffer.from([0x1b, 0x70, 0x00, 0x19, 0xfa]));
    this.previewLines.push("[*** CASH DRAWER OPENED ***]");
    return this;
  }

  /**
   * QR Code Generation sequence using standard ESC/POS model 2 command
   */
  qrCode(data: string, size = 4): this {
    if (!data) return this;
    const str = data.trim();
    const len = str.length + 3;
    const pL = len % 256;
    const pH = Math.floor(len / 256);

    // GS ( k : Model 2
    this.chunks.push(Buffer.from([0x1d, 0x28, 0x6b, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00]));
    // GS ( k : Module size
    this.chunks.push(Buffer.from([0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x43, Math.min(8, Math.max(1, size))]));
    // GS ( k : Error correction level M (49)
    this.chunks.push(Buffer.from([0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x45, 0x31]));
    // GS ( k : Store data
    this.chunks.push(Buffer.from([0x1d, 0x28, 0x6b, pL, pH, 0x31, 0x50, 0x30]));
    this.chunks.push(Buffer.from(str, "latin1"));
    // GS ( k : Print QR code
    this.chunks.push(Buffer.from([0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x51, 0x30]));

    this.align("center");
    this.previewLines.push(`[QR CODE: ${str}]`);
    return this;
  }

  /**
   * Helper to format line for text preview based on alignment
   */
  private addPreviewLine(text: string) {
    const width = this.characterWidth;
    let formatted = text;
    if (this.currentAlign === "center") {
      const leftPad = Math.max(0, Math.floor((width - text.length) / 2));
      formatted = " ".repeat(leftPad) + text;
    } else if (this.currentAlign === "right") {
      const leftPad = Math.max(0, width - text.length);
      formatted = " ".repeat(leftPad) + text;
    }
    this.previewLines.push(formatted);
  }

  /**
   * Returns compiled binary Buffer ready for network TCP socket or USB bridge
   */
  toBuffer(): Buffer {
    return Buffer.concat(this.chunks);
  }

  /**
   * Returns Base64 encoded payload
   */
  toBase64(): string {
    return this.toBuffer().toString("base64");
  }

  /**
   * Returns monospace text preview string
   */
  toPreviewText(): string {
    return this.previewLines.join("\n");
  }

  /**
   * Return character width
   */
  getCharWidth(): number {
    return this.characterWidth;
  }
}
