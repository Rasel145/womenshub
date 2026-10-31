import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";
import { business as b } from "@/lib/business";
import {
  PAYMENT_LABEL,
  STATUS_LABEL,
  formatDateTime,
  type OrderStatus,
} from "@/lib/order-status";
import { MONTH_NAMES, daysInMonth, summarize, type ExportOrder } from "@/lib/reports";

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 40;
const MAX_PDF_ORDERS = 3000;

const INK = rgb(0.07, 0.07, 0.07);
const GRAY = rgb(0.42, 0.42, 0.42);
const LINE = rgb(0.85, 0.85, 0.85);
const PINK = rgb(0.898, 0, 0.431);

// The built-in PDF font cannot write Bangla or the taka sign, so anything it cannot
// write becomes "?". That is why names are not printed in the PDF.
function safe(text: string) {
  return text.replace(/[^\x20-\x7E\xA0-\xFF]/g, "?");
}

const money = (n: number) => n.toLocaleString("en-US");

export async function buildPdf(opts: {
  orders: ExportOrder[];
  year: number;
  month?: number;
}): Promise<Uint8Array> {
  const { orders, year, month } = opts;
  const { monthly, totals, top, days } = summarize(orders, month);
  const period = month ? `${MONTH_NAMES[month - 1]} ${year}` : String(year);

  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  let page = pdf.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - MARGIN;

  const draw = (
    text: string,
    x: number,
    yy: number,
    size = 9,
    f: PDFFont = font,
    color = INK
  ) => {
    page.drawText(safe(text), { x, y: yy, size, font: f, color });
  };

  const drawRight = (
    text: string,
    xRight: number,
    yy: number,
    size = 9,
    f: PDFFont = font,
    color = INK
  ) => {
    const w = f.widthOfTextAtSize(safe(text), size);
    draw(text, xRight - w, yy, size, f, color);
  };

  // Cuts a long text so it fits a column
  const fit = (text: string, maxWidth: number, size: number, f: PDFFont) => {
    let t = safe(text);
    if (f.widthOfTextAtSize(t, size) <= maxWidth) return t;
    while (t.length > 1 && f.widthOfTextAtSize(t + "..", size) > maxWidth) t = t.slice(0, -1);
    return t + "..";
  };

  const rule = (yy: number) =>
    page.drawLine({
      start: { x: MARGIN, y: yy },
      end: { x: PAGE_W - MARGIN, y: yy },
      thickness: 0.5,
      color: LINE,
    });

  const newPage = () => {
    page = pdf.addPage([PAGE_W, PAGE_H]);
    y = PAGE_H - MARGIN;
  };

  // ------------------------------------------------------------------ Title
  draw(b.brand, MARGIN, y, 18, bold, PINK);
  y -= 20;
  draw(`Sales report - ${period}`, MARGIN, y, 12, bold);
  y -= 14;
  draw(
    `Created ${formatDateTime(new Date())} (Bangladesh time). Amounts are in BDT.`,
    MARGIN,
    y,
    8,
    font,
    GRAY
  );
  y -= 26;

  // ---------------------------------------------------------- Key figures
  const figures: [string, string][] = [
    ["Orders placed", String(totals.orders)],
    ["Sales (not cancelled)", money(totals.sales)],
    ["Delivered revenue", money(totals.deliveredRevenue)],
    ["Cancelled orders", String(totals.cancelled)],
    ["Delivered orders", String(totals.delivered)],
    ["Average order", money(totals.averageOrder)],
  ];

  const boxW = (PAGE_W - 2 * MARGIN - 20) / 3;
  figures.forEach(([label, value], idx) => {
    const x = MARGIN + (idx % 3) * (boxW + 10);
    const boxTop = y - Math.floor(idx / 3) * 46;

    page.drawRectangle({
      x,
      y: boxTop - 38,
      width: boxW,
      height: 38,
      borderColor: LINE,
      borderWidth: 0.7,
    });
    draw(label, x + 8, boxTop - 14, 8, font, GRAY);
    draw(value, x + 8, boxTop - 31, 13, bold);
  });
  y -= 2 * 46 + 10;

  // ------------------------------------------------------------------ Chart
  const values = month ? days.slice(0, daysInMonth(year, month)) : monthly.map((m) => m.sales);
  const labels = month
    ? values.map((_, i) => String(i + 1))
    : MONTH_NAMES.map((m) => m.slice(0, 3));

  draw(month ? "Orders per day" : "Sales per month (BDT)", MARGIN, y, 10, bold);
  y -= 8;

  const chartH = 110;
  const slot = (PAGE_W - 2 * MARGIN) / values.length;
  const barW = Math.min(24, slot * 0.7);
  const maxValue = Math.max(...values, 1);

  values.forEach((v, i) => {
    const h = (v / maxValue) * (chartH - 24);
    const x = MARGIN + i * slot + (slot - barW) / 2;

    page.drawRectangle({ x, y: y - chartH + 12, width: barW, height: h, color: PINK });

    if (!month || i % 2 === 0) {
      const w = font.widthOfTextAtSize(labels[i], 7);
      draw(labels[i], x + barW / 2 - w / 2, y - chartH + 2, 7, font, GRAY);
    }
  });
  y -= chartH + 18;

  // ------------------------------------------------------ Monthly table (year)
  if (!month) {
    draw("Month by month", MARGIN, y, 10, bold);
    y -= 14;

    const right = [150, 215, 280, 380, 515];
    draw("Month", MARGIN, y, 8, bold, GRAY);
    ["Orders", "Cancelled", "Delivered", "Sales", "Delivered revenue"].forEach((h, i) =>
      drawRight(h, MARGIN + right[i], y, 8, bold, GRAY)
    );
    y -= 4;
    rule(y);
    y -= 12;

    for (const m of monthly) {
      draw(MONTH_NAMES[m.month - 1], MARGIN, y, 9);
      drawRight(String(m.orders), MARGIN + right[0], y);
      drawRight(String(m.cancelled), MARGIN + right[1], y);
      drawRight(String(m.delivered), MARGIN + right[2], y);
      drawRight(money(m.sales), MARGIN + right[3], y);
      drawRight(money(m.deliveredRevenue), MARGIN + right[4] - 20, y);
      y -= 13;
    }
    y -= 10;
  }

  // ----------------------------------------------------------- Top products
  if (top.length > 0) {
    if (y < 200) newPage();
    draw("Best selling products", MARGIN, y, 10, bold);
    y -= 14;
    draw("Product", MARGIN, y, 8, bold, GRAY);
    drawRight("Quantity", MARGIN + 400, y, 8, bold, GRAY);
    drawRight("Sales", PAGE_W - MARGIN, y, 8, bold, GRAY);
    y -= 4;
    rule(y);
    y -= 12;

    for (const p of top) {
      draw(fit(p.name, 340, 9, font), MARGIN, y, 9);
      drawRight(String(p.qty), MARGIN + 400, y);
      drawRight(money(p.sales), PAGE_W - MARGIN, y);
      y -= 13;
    }
  }

  // -------------------------------------------------------------- Order list
  newPage();
  draw("Orders", MARGIN, y, 12, bold);
  y -= 6;
  draw(
    "Customer names, phone numbers and addresses are not printed here. They are in the Excel file.",
    MARGIN,
    y - 8,
    8,
    font,
    GRAY
  );
  y -= 28;

  const header = () => {
    draw("Order", MARGIN, y, 8, bold, GRAY);
    draw("Date", MARGIN + 88, y, 8, bold, GRAY);
    draw("City", MARGIN + 190, y, 8, bold, GRAY);
    draw("Payment", MARGIN + 275, y, 8, bold, GRAY);
    draw("Status", MARGIN + 350, y, 8, bold, GRAY);
    drawRight("Items", MARGIN + 430, y, 8, bold, GRAY);
    drawRight("Total", PAGE_W - MARGIN, y, 8, bold, GRAY);
    y -= 4;
    rule(y);
    y -= 12;
  };
  header();

  const shown = orders.slice(0, MAX_PDF_ORDERS);
  for (const o of shown) {
    if (y < MARGIN + 24) {
      newPage();
      header();
    }

    draw(o.orderNumber, MARGIN, y, 8);
    draw(formatDateTime(o.createdAt), MARGIN + 88, y, 8);
    draw(fit(o.city, 80, 8, font), MARGIN + 190, y, 8);
    draw(fit(PAYMENT_LABEL[o.paymentMethod] ?? o.paymentMethod, 70, 8, font), MARGIN + 275, y, 8);
    draw(STATUS_LABEL[o.status as OrderStatus], MARGIN + 350, y, 8);
    drawRight(String(o.items.reduce((s, i) => s + i.quantity, 0)), MARGIN + 430, y, 8);
    drawRight(money(o.total), PAGE_W - MARGIN, y, 8);
    y -= 13;
  }

  if (shown.length === 0) draw("No orders in this period.", MARGIN, y, 9, font, GRAY);
  if (orders.length > shown.length) {
    y -= 6;
    draw(
      `Only the first ${shown.length} of ${orders.length} orders are listed. Download the Excel file for all of them.`,
      MARGIN,
      y,
      8,
      font,
      GRAY
    );
  }

  // ----------------------------------------------------------- Page numbers
  const pages = pdf.getPages();
  pages.forEach((p, i) => {
    p.drawText(`Page ${i + 1} of ${pages.length}`, {
      x: PAGE_W - MARGIN - 50,
      y: 22,
      size: 8,
      font,
      color: GRAY,
    });
    p.drawText(safe(`${b.brand} - ${period}`), {
      x: MARGIN,
      y: 22,
      size: 8,
      font,
      color: GRAY,
    });
  });

  return pdf.save();
}