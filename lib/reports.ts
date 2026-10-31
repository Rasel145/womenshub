import { prisma } from "@/lib/prisma";
import type { Prisma } from "../generated/prisma/client";
import type { OrderStatus } from "@/lib/order-status";

// Bangladesh is UTC+6 all year (no daylight saving). Months and days are counted in this time.
const DHAKA_OFFSET_MS = 6 * 60 * 60 * 1000;

export const MAX_EXPORT_ORDERS = 20000;

export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export type ExportOrder = Prisma.OrderGetPayload<{ include: { items: true } }>;

export type MonthRow = {
  month: number; // 1 to 12
  orders: number; // all orders placed, including cancelled
  cancelled: number;
  delivered: number;
  sales: number; // total of orders that were not cancelled
  deliveredRevenue: number; // total of delivered orders only
};

export type Totals = Omit<MonthRow, "month"> & { averageOrder: number };

// The first moment of a month (or of January) in Bangladesh time, as a normal Date
export function dhakaStart(year: number, month = 1) {
  return new Date(Date.UTC(year, month - 1, 1) - DHAKA_OFFSET_MS);
}

export function dhakaRange(year: number, month?: number) {
  const start = dhakaStart(year, month ?? 1);
  const end = month ? dhakaStart(year, month + 1) : dhakaStart(year + 1, 1);
  return { start, end };
}

// Read the result with getUTC...() methods: they give Bangladesh date and time
export function toDhaka(date: Date) {
  return new Date(date.getTime() + DHAKA_OFFSET_MS);
}

export function dhakaNow() {
  const d = toDhaka(new Date());
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 };
}

export function daysInMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

// "2026-09-30 18:00:00" (UTC), used in the raw SQL below
function utcSql(date: Date) {
  return date.toISOString().slice(0, 19).replace("T", " ");
}

function emptyMonths(): MonthRow[] {
  return Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    orders: 0,
    cancelled: 0,
    delivered: 0,
    sales: 0,
    deliveredRevenue: 0,
  }));
}

export function totalsOf(rows: Pick<MonthRow, "orders" | "cancelled" | "delivered" | "sales" | "deliveredRevenue">[]): Totals {
  const t = { orders: 0, cancelled: 0, delivered: 0, sales: 0, deliveredRevenue: 0 };
  for (const r of rows) {
    t.orders += r.orders;
    t.cancelled += r.cancelled;
    t.delivered += r.delivered;
    t.sales += r.sales;
    t.deliveredRevenue += r.deliveredRevenue;
  }

  const active = t.orders - t.cancelled;
  return { ...t, averageOrder: active > 0 ? Math.round(t.sales / active) : 0 };
}

// 12 rows, one for each month of the year
export async function getYearSummary(year: number): Promise<MonthRow[]> {
  const { start, end } = dhakaRange(year);

  const rows = await prisma.$queryRaw<
    { month: number; status: string; orders: bigint; total: bigint }[]
  >`
    SELECT EXTRACT(MONTH FROM (("createdAt" AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Dhaka'))::int AS month,
           "status"::text AS status,
           COUNT(*)::bigint AS orders,
           COALESCE(SUM("total"), 0)::bigint AS total
    FROM "Order"
    WHERE "createdAt" >= ${utcSql(start)}::timestamp
      AND "createdAt" < ${utcSql(end)}::timestamp
    GROUP BY 1, 2
  `;

  const months = emptyMonths();

  for (const r of rows) {
    const row = months[Number(r.month) - 1];
    if (!row) continue;

    const orders = Number(r.orders);
    const total = Number(r.total);

    row.orders += orders;
    if (r.status === "CANCELLED") {
      row.cancelled += orders;
      continue;
    }

    row.sales += total;
    if (r.status === "DELIVERED") {
      row.delivered += orders;
      row.deliveredRevenue += total;
    }
  }

  return months;
}

// The years from the first order until now, newest first
export async function getAvailableYears() {
  const first = await prisma.order.findFirst({
    orderBy: { createdAt: "asc" },
    select: { createdAt: true },
  });

  const now = dhakaNow().year;
  const from = first ? toDhaka(first.createdAt).getUTCFullYear() : now;

  const years: number[] = [];
  for (let y = now; y >= from; y--) years.push(y);
  return years;
}

// Details of one month: orders per status, per day, and the best selling products
export async function getMonthReport(year: number, month: number) {
  const { start, end } = dhakaRange(year, month);
  const from = utcSql(start);
  const to = utcSql(end);

  const [statusRows, dailyRows, topRows] = await Promise.all([
    prisma.order.groupBy({
      by: ["status"],
      where: { createdAt: { gte: start, lt: end } },
      _count: { _all: true },
    }),

    prisma.$queryRaw<{ day: number; orders: bigint }[]>`
      SELECT EXTRACT(DAY FROM (("createdAt" AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Dhaka'))::int AS day,
             COUNT(*)::bigint AS orders
      FROM "Order"
      WHERE "createdAt" >= ${from}::timestamp AND "createdAt" < ${to}::timestamp
      GROUP BY 1
    `,

    prisma.$queryRaw<{ name: string; qty: bigint; sales: bigint }[]>`
      SELECT oi."productName" AS name,
             SUM(oi."quantity")::bigint AS qty,
             SUM(oi."quantity" * oi."unitPrice")::bigint AS sales
      FROM "OrderItem" oi
      JOIN "Order" o ON o."id" = oi."orderId"
      WHERE o."createdAt" >= ${from}::timestamp AND o."createdAt" < ${to}::timestamp
        AND o."status" <> 'CANCELLED'
      GROUP BY oi."productName"
      ORDER BY qty DESC, sales DESC
      LIMIT 10
    `,
  ]);

  const statuses: Record<string, number> = {};
  for (const s of statusRows) statuses[s.status] = s._count._all;

  const days = new Array<number>(daysInMonth(year, month)).fill(0);
  for (const d of dailyRows) {
    if (d.day >= 1 && d.day <= days.length) days[Number(d.day) - 1] = Number(d.orders);
  }

  const top = topRows.map((t) => ({
    name: t.name,
    qty: Number(t.qty),
    sales: Number(t.sales),
  }));

  return { statuses, days, top };
}

export async function getMonthOrders(opts: {
  year: number;
  month: number;
  status?: OrderStatus;
  page: number;
  pageSize: number;
}) {
  const { start, end } = dhakaRange(opts.year, opts.month);
  const where = {
    createdAt: { gte: start, lt: end },
    ...(opts.status && { status: opts.status }),
  };

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (opts.page - 1) * opts.pageSize,
      take: opts.pageSize,
      select: {
        id: true,
        orderNumber: true,
        createdAt: true,
        name: true,
        phone: true,
        paymentMethod: true,
        status: true,
        total: true,
      },
    }),
    prisma.order.count({ where }),
  ]);

  return { orders, total };
}

// Everything needed for an Excel or PDF file
export async function getExportOrders(year: number, month?: number) {
  const { start, end } = dhakaRange(year, month);

  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: start, lt: end } },
    orderBy: { createdAt: "asc" },
    include: { items: true },
    take: MAX_EXPORT_ORDERS + 1,
  });

  return {
    orders: orders.slice(0, MAX_EXPORT_ORDERS),
    tooMany: orders.length > MAX_EXPORT_ORDERS,
  };
}

// Numbers for the first page of the Excel and PDF files, counted from the same orders
// that are written in the file, so the figures always match
export function summarize(orders: ExportOrder[], month?: number) {
  const monthly = emptyMonths();
  const days = month ? new Array<number>(31).fill(0) : [];
  const products = new Map<string, { name: string; qty: number; sales: number }>();

  for (const o of orders) {
    const local = toDhaka(o.createdAt);
    const row = monthly[local.getUTCMonth()];

    row.orders += 1;
    if (days.length) days[local.getUTCDate() - 1] += 1;

    if (o.status === "CANCELLED") {
      row.cancelled += 1;
      continue;
    }

    row.sales += o.total;
    if (o.status === "DELIVERED") {
      row.delivered += 1;
      row.deliveredRevenue += o.total;
    }

    for (const item of o.items) {
      const p = products.get(item.productName) ?? {
        name: item.productName,
        qty: 0,
        sales: 0,
      };
      p.qty += item.quantity;
      p.sales += item.quantity * item.unitPrice;
      products.set(item.productName, p);
    }
  }

  const top = [...products.values()]
    .sort((a, b) => b.qty - a.qty || b.sales - a.sales)
    .slice(0, 10);

  return { monthly, totals: totalsOf(monthly), top, days };
}