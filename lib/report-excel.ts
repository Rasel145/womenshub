import ExcelJS from "exceljs";
import { business as b } from "@/lib/business";
import { PAYMENT_LABEL, STATUS_LABEL, type OrderStatus } from "@/lib/order-status";
import { MONTH_NAMES, summarize, toDhaka, type ExportOrder } from "@/lib/reports";

const PINK = "FFE5006E";
const MONEY = "#,##0";

function styleHeader(row: ExcelJS.Row) {
  row.font = { bold: true, color: { argb: "FFFFFFFF" } };
  row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: PINK } };
  row.alignment = { vertical: "middle" };
}

export async function buildExcel(opts: {
  orders: ExportOrder[];
  year: number;
  month?: number;
}): Promise<Buffer> {
  const { orders, year, month } = opts;
  const { monthly, totals, top } = summarize(orders, month);
  const period = month ? `${MONTH_NAMES[month - 1]} ${year}` : String(year);

  const wb = new ExcelJS.Workbook();
  wb.creator = b.brand;
  wb.created = new Date();

  // ---------------------------------------------------------------- Summary
  const s = wb.addWorksheet("Summary");
  s.columns = [
    { width: 32 },
    { width: 16 },
    { width: 16 },
    { width: 16 },
    { width: 18 },
    { width: 20 },
    { width: 18 },
  ];

  s.addRow([`${b.brand} - sales report`]).font = { bold: true, size: 16 };
  s.addRow([`Period: ${period}`]);
  s.addRow(["All amounts are in BDT. Months and times are in Bangladesh time."]);
  s.addRow([]);

  styleHeader(s.addRow(["Key figures", ""]));
  const figures: [string, number][] = [
    ["Orders placed", totals.orders],
    ["Cancelled orders", totals.cancelled],
    ["Delivered orders", totals.delivered],
    ["Sales (orders that were not cancelled)", totals.sales],
    ["Delivered revenue", totals.deliveredRevenue],
    ["Average order value", totals.averageOrder],
  ];
  for (const [label, value] of figures) {
    const row = s.addRow([label, value]);
    row.getCell(2).numFmt = MONEY;
  }
  s.addRow([]);

  // A year file also lists every month
  if (!month) {
    styleHeader(
      s.addRow(["Month", "Orders", "Cancelled", "Delivered", "Sales", "Delivered revenue", "Average order"])
    );
    for (const m of monthly) {
      const active = m.orders - m.cancelled;
      const row = s.addRow([
        MONTH_NAMES[m.month - 1],
        m.orders,
        m.cancelled,
        m.delivered,
        m.sales,
        m.deliveredRevenue,
        active > 0 ? Math.round(m.sales / active) : 0,
      ]);
      row.getCell(5).numFmt = MONEY;
      row.getCell(6).numFmt = MONEY;
      row.getCell(7).numFmt = MONEY;
    }
    s.addRow([]);
  }

  styleHeader(s.addRow(["Best selling products", "Quantity", "Sales"]));
  for (const p of top) {
    const row = s.addRow([p.name, p.qty, p.sales]);
    row.getCell(3).numFmt = MONEY;
  }
  if (top.length === 0) s.addRow(["No sales in this period"]);

  // ----------------------------------------------------------------- Orders
  const o = wb.addWorksheet("Orders");
  o.columns = [
    { header: "Order", key: "orderNumber", width: 14 },
    { header: "Date (Bangladesh time)", key: "date", width: 20 },
    { header: "Customer", key: "name", width: 22 },
    { header: "Mobile", key: "phone", width: 14 },
    { header: "City", key: "city", width: 16 },
    { header: "Address", key: "address", width: 40 },
    { header: "Area", key: "area", width: 14 },
    { header: "Payment", key: "payment", width: 18 },
    { header: "Status", key: "status", width: 12 },
    { header: "Items", key: "items", width: 8 },
    { header: "Subtotal", key: "subtotal", width: 12 },
    { header: "Delivery", key: "delivery", width: 10 },
    { header: "Total", key: "total", width: 12 },
    { header: "Courier", key: "courier", width: 14 },
    { header: "Tracking code", key: "tracking", width: 18 },
  ];
  styleHeader(o.getRow(1));

  for (const order of orders) {
    o.addRow({
      orderNumber: order.orderNumber,
      // Excel has no time zones, so the Bangladesh clock time is written as it is
      date: toDhaka(order.createdAt),
      name: order.name,
      phone: order.phone,
      city: order.city,
      address: order.address,
      area: order.area === "DHAKA" ? "Inside Dhaka" : "Outside Dhaka",
      payment: PAYMENT_LABEL[order.paymentMethod] ?? order.paymentMethod,
      status: STATUS_LABEL[order.status as OrderStatus],
      items: order.items.reduce((sum, i) => sum + i.quantity, 0),
      subtotal: order.subtotal,
      delivery: order.deliveryFee,
      total: order.total,
      courier: order.courier ?? "",
      tracking: order.trackingCode ?? "",
    });
  }
  o.getColumn("date").numFmt = "dd-mmm-yyyy hh:mm";
  for (const key of ["subtotal", "delivery", "total"]) o.getColumn(key).numFmt = MONEY;
  o.views = [{ state: "frozen", ySplit: 1 }];
  o.autoFilter = { from: "A1", to: { row: 1, column: o.columns.length } };

  // ------------------------------------------------------------------ Items
  const i = wb.addWorksheet("Items");
  i.columns = [
    { header: "Order", key: "orderNumber", width: 14 },
    { header: "Product", key: "product", width: 40 },
    { header: "Option", key: "variant", width: 16 },
    { header: "Quantity", key: "qty", width: 10 },
    { header: "Unit price", key: "unit", width: 12 },
    { header: "Line total", key: "line", width: 12 },
    { header: "Order status", key: "status", width: 14 },
  ];
  styleHeader(i.getRow(1));

  for (const order of orders) {
    for (const item of order.items) {
      i.addRow({
        orderNumber: order.orderNumber,
        product: item.productName,
        variant: item.variant ?? "",
        qty: item.quantity,
        unit: item.unitPrice,
        line: item.quantity * item.unitPrice,
        status: STATUS_LABEL[order.status as OrderStatus],
      });
    }
  }
  i.getColumn("unit").numFmt = MONEY;
  i.getColumn("line").numFmt = MONEY;
  i.views = [{ state: "frozen", ySplit: 1 }];
  i.autoFilter = { from: "A1", to: { row: 1, column: i.columns.length } };

  return Buffer.from(await wb.xlsx.writeBuffer());
}