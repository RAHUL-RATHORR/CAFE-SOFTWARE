import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";

export class ExportService {
  /**
   * Generates a CSV string from an array of objects
   */
  static generateCSV(data: any[]): string {
    if (!data || data.length === 0) return "";
    
    // Get headers
    const headers = Object.keys(data[0]);
    
    // Format rows
    const rows = data.map(row => {
      return headers.map(header => {
        let cell = row[header];
        if (cell === null || cell === undefined) cell = "";
        
        const cellString = String(cell);
        
        // Escape quotes and commas
        if (cellString.includes(",") || cellString.includes('"') || cellString.includes("\n")) {
          return `"${cellString.replace(/"/g, '""')}"`;
        }
        return cellString;
      }).join(",");
    });
    
    return [headers.join(","), ...rows].join("\n");
  }

  /**
   * Generates an Excel buffer from an array of objects
   */
  static async generateExcel(data: any[], reportName: string): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "DineFlow";
    workbook.created = new Date();

    const sheet = workbook.addWorksheet(reportName);

    if (data && data.length > 0) {
      const headers = Object.keys(data[0]);
      
      // Setup columns
      sheet.columns = headers.map(header => ({
        header: header.charAt(0).toUpperCase() + header.slice(1).replace(/([A-Z])/g, ' $1'),
        key: header,
        width: 20
      }));

      // Make header row bold
      sheet.getRow(1).font = { bold: true };
      sheet.views = [{ state: "frozen", xSplit: 0, ySplit: 1 }];

      // Add rows
      sheet.addRows(data);
    } else {
      sheet.addRow(["No data available for this report."]);
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  /**
   * Generates a PDF buffer from an array of objects
   */
  static async generatePDF(data: any[], reportName: string, meta: { restaurantName: string, branchName: string, dateRange: string }): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 30, size: "A4", layout: "landscape" });
        const buffers: Buffer[] = [];
        
        doc.on("data", buffers.push.bind(buffers));
        doc.on("end", () => resolve(Buffer.concat(buffers)));

        // Header
        doc.fontSize(20).text(meta.restaurantName, { align: "center" });
        doc.fontSize(12).text(meta.branchName, { align: "center" });
        doc.moveDown();
        doc.fontSize(16).text(`Report: ${reportName}`, { align: "center" });
        doc.fontSize(10).text(`Date: ${meta.dateRange}`, { align: "center" });
        doc.fontSize(10).text(`Generated At: ${new Date().toLocaleString()}`, { align: "center" });
        doc.moveDown(2);

        if (!data || data.length === 0) {
          doc.fontSize(12).text("No data available for this report.", { align: "center" });
          doc.end();
          return;
        }

        // Table generation
        const headers = Object.keys(data[0]);
        const startX = 30;
        let currentY = doc.y;
        
        // Calculate column widths based on available space (A4 landscape width is 842, minus 60 margins = 782)
        const columnWidth = 782 / headers.length;

        // Draw headers
        doc.font("Helvetica-Bold").fontSize(10);
        headers.forEach((header, i) => {
          doc.text(
            header.charAt(0).toUpperCase() + header.slice(1).replace(/([A-Z])/g, ' $1'), 
            startX + (i * columnWidth), 
            currentY, 
            { width: columnWidth, align: "left" }
          );
        });
        
        currentY += 15;
        doc.moveTo(startX, currentY).lineTo(startX + 782, currentY).stroke();
        currentY += 5;

        // Draw rows
        doc.font("Helvetica").fontSize(9);
        data.forEach(row => {
          // Add new page if we run out of space
          if (currentY > 550) {
            doc.addPage({ margin: 30, size: "A4", layout: "landscape" });
            currentY = 30;
            
            // Redraw headers
            doc.font("Helvetica-Bold").fontSize(10);
            headers.forEach((header, i) => {
              doc.text(
                header.charAt(0).toUpperCase() + header.slice(1).replace(/([A-Z])/g, ' $1'), 
                startX + (i * columnWidth), 
                currentY, 
                { width: columnWidth, align: "left" }
              );
            });
            currentY += 15;
            doc.moveTo(startX, currentY).lineTo(startX + 782, currentY).stroke();
            currentY += 5;
            doc.font("Helvetica").fontSize(9);
          }

          let maxHeight = 15;
          headers.forEach((header, i) => {
            let cell = row[header];
            if (cell === null || cell === undefined) cell = "";
            const text = String(cell);
            
            const height = doc.heightOfString(text, { width: columnWidth - 5 });
            if (height > maxHeight) maxHeight = height;
            
            doc.text(text, startX + (i * columnWidth), currentY, { width: columnWidth - 5, align: "left" });
          });
          currentY += maxHeight + 5;
        });

        // Footer with page numbers
        const pages = doc.bufferedPageRange();
        for (let i = 0; i < pages.count; i++) {
          doc.switchToPage(i);
          doc.fontSize(8).text(
            `Page ${i + 1} of ${pages.count}`,
            30,
            doc.page.height - 30,
            { align: "center", width: doc.page.width - 60 }
          );
        }

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}
