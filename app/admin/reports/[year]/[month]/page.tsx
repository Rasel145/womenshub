import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import clsx from "clsx";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { formatPrice } from "@/lib/utils";
import BarChart from "@/components/admin/BarChart";
import DownloadLinks from "@/components/admin/DownloadLinks";
import {
  ORDER_STATUSES,
  STATUS_LABEL,
  STATUS_STYLE,
  PAYMENT_LABEL,
  formatDateTime,
  type OrderStatus,
} from "@/lib/order-status";
import {
  MONTH_NAMES,
  dhakaNow,
  getMonthOrders,
  getMonthReport,
  getYearSummary,
  totalsOf,
} from "@/lib/reports";

const PAGE_SIZE = 50;

type Params = Promise<{ year: string; month: string }>;
type SearchParams = Promise<{ status?: string; page?: string }>;

export default function MonthReportPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  return (
    <Suspense fallback={<p className="text-gray-500">Loading...</p>}>
      <MonthContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

function Change({ current, previous }: { current: number; previous: number }) {
  if (previous === 0) return <span className="text-gray-400">-</span>;

  const percent = Math.round(((current - previous) / previous) * 100);
  return (
    <span className={percent >= 0 ? "text-green-600" : "text-red-600"}>
      {percent >= 0 ? "+" : ""}
      {percent}%
    </span>
  );
}

function monthHref(year: number, month: number) {
  // Month 0 or 13 rolls over into the neighbouring year
  if (month < 1) return `/admin/reports/${year - 1}/12`;
  if (month > 12) return `/admin/reports/${year + 1}/1`;
  return `/admin/reports/${year}/${month}`;
}

async function MonthContent({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  await requireAdmin();

  const p = await params;
  const sp = await searchParams;

  const year = Number(p.year);
  const month = Number(p.month);
  if (
    !Number.isInteger(year) ||
    year < 2020 ||
    year > 2100 ||
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12
  )
    notFound();

  const status = ORDER_STATUSES.find((s) => s === sp.status);
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);

  const [report, yearRows, prevYearRows, list] = await Promise.all([
    getMonthReport(year, month),
    getYearSummary(year),
    getYearSummary(year - 1),
    getMonthOrders({ year, month, status, page, pageSize: PAGE_SIZE }),
  ]);

  const current = yearRows[month - 1];
  const totals = totalsOf([current]);
  const previousMonth = month > 1 ? yearRows[month - 2] : prevYearRows[11];
  const lastYear = prevYearRows[month - 1];

  const now = dhakaNow();
  const isFuture = year > now.year || (year === now.year && month > now.month);
  const totalPages = Math.max(1, Math.ceil(list.total / PAGE_SIZE));
  const monthName = MONTH_NAMES[month - 1];

  const href = (extra: { status?: string; page?: number }) => {
    const q = new URLSearchParams();
    if (extra.status) q.set("status", extra.status);
    if (extra.page && extra.page > 1) q.set("page", String(extra.page));
    const s = q.toString();
    return `/admin/reports/${year}/${month}${s ? `?${s}` : ""}`;
  };

  const maxStatus = Math.max(1, ...ORDER_STATUSES.map((s) => report.statuses[s] ?? 0));

  return (
    <div>
      <Link
        href={`/admin/reports?year=${year}`}
        className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-pink-600"
      >
        <ArrowLeft size={16} />
        {year} report
      </Link>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link
            href={monthHref(year, month - 1)}
            aria-label="Previous month"
            className="rounded-lg border p-1.5 hover:bg-gray-50"
          >
            <ChevronLeft size={18} />
          </Link>
          <h1 className="text-2xl font-bold">
            {monthName} {year}
          </h1>
          {!isFuture && (
            <Link
              href={monthHref(year, month + 1)}
              aria-label="Next month"
              className="rounded-lg border p-1.5 hover:bg-gray-50"
            >
              <ChevronRight size={18} />
            </Link>
          )}
        </div>
        <DownloadLinks year={year} month={month} />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <div className="rounded-xl border bg-white p-4">
          <p className="text-xs text-gray-500">Orders placed</p>
          <p className="mt-1 text-xl font-bold">{totals.orders}</p>
          <p className="mt-1 text-xs text-gray-500">
            <Change current={current.orders} previous={previousMonth.orders} /> vs last month
          </p>
          <p className="text-xs text-gray-500">
            <Change current={current.orders} previous={lastYear.orders} /> vs {monthName}{" "}
            {year - 1}
          </p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-xs text-gray-500">Sales</p>
          <p className="mt-1 text-xl font-bold">{formatPrice(totals.sales)}</p>
          <p className="mt-1 text-xs text-gray-500">
            <Change current={current.sales} previous={previousMonth.sales} /> vs last month
          </p>
          <p className="text-xs text-gray-500">
            <Change current={current.sales} previous={lastYear.sales} /> vs {monthName}{" "}
            {year - 1}
          </p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-xs text-gray-500">Delivered revenue</p>
          <p className="mt-1 text-xl font-bold">{formatPrice(totals.deliveredRevenue)}</p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-xs text-gray-500">Average order</p>
          <p className="mt-1 text-xl font-bold">{formatPrice(totals.averageOrder)}</p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-xs text-gray-500">Cancelled</p>
          <p className="mt-1 text-xl font-bold">{totals.cancelled}</p>
          <p className="mt-1 text-xs text-gray-500">
            {totals.orders ? Math.round((totals.cancelled / totals.orders) * 100) : 0}% of orders
          </p>
        </div>
      </div>

      <div className="mt-6">
        <BarChart
          title="Orders per day"
          labels={report.days.map((_, i) => String(i + 1))}
          series={[{ name: monthName, values: report.days, color: "pink" }]}
          labelEvery={2}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Status */}
        <section className="rounded-xl border bg-white p-4">
          <h2 className="mb-3 font-semibold">Orders by status</h2>
          <ul className="space-y-2.5 text-sm">
            {ORDER_STATUSES.map((s) => {
              const count = report.statuses[s] ?? 0;
              return (
                <li key={s}>
                  <div className="mb-1 flex justify-between">
                    <span>{STATUS_LABEL[s]}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-pink-600"
                      style={{ width: `${(count / maxStatus) * 100}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Top products */}
        <section className="rounded-xl border bg-white p-4">
          <h2 className="mb-3 font-semibold">Best selling products</h2>
          {report.top.length === 0 ? (
            <p className="text-sm text-gray-500">No sales in this month.</p>
          ) : (
            <ol className="space-y-2 text-sm">
              {report.top.map((t, i) => (
                <li key={t.name} className="flex items-start justify-between gap-3">
                  <span>
                    <span className="mr-2 text-gray-400">{i + 1}.</span>
                    {t.name}
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="font-medium">{t.qty} sold</span>
                    <span className="block text-xs text-gray-500">{formatPrice(t.sales)}</span>
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      {/* Order list */}
      <div className="mt-8">
        <h2 className="mb-3 text-lg font-semibold">Orders in {monthName}</h2>

        <div className="mb-4 flex flex-wrap gap-2">
          <Link
            href={href({})}
            className={clsx(
              "rounded-full px-3 py-1 text-sm",
              !status ? "bg-pink-600 text-white" : "bg-gray-100 hover:bg-gray-200"
            )}
          >
            All
          </Link>
          {ORDER_STATUSES.map((s) => (
            <Link
              key={s}
              href={href({ status: s })}
              className={clsx(
                "rounded-full px-3 py-1 text-sm",
                status === s ? "bg-pink-600 text-white" : "bg-gray-100 hover:bg-gray-200"
              )}
            >
              {STATUS_LABEL[s]}
            </Link>
          ))}
        </div>

        {list.orders.length === 0 ? (
          <p className="rounded-xl border bg-white p-8 text-center text-sm text-gray-500">
            No orders found.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-gray-50 text-xs text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Order</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Payment</th>
                  <th className="px-4 py-3 text-right font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {list.orders.map((o) => (
                  <tr key={o.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">
                      <Link href={`/admin/orders/${o.id}`} className="text-pink-600">
                        #{o.orderNumber}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                      {formatDateTime(o.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <p>{o.name}</p>
                      <p className="text-xs text-gray-500">{o.phone}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {PAYMENT_LABEL[o.paymentMethod] ?? o.paymentMethod}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">
                      {formatPrice(o.total)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={clsx(
                          "rounded-full px-2 py-0.5 text-xs font-medium",
                          STATUS_STYLE[o.status as OrderStatus]
                        )}
                      >
                        {STATUS_LABEL[o.status as OrderStatus]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between text-sm">
            <p className="text-gray-500">
              Page {page} of {totalPages} · {list.total} orders
            </p>
            <div className="flex gap-2">
              {page > 1 && (
                <Link
                  href={href({ status, page: page - 1 })}
                  className="rounded-lg border px-3 py-1.5 hover:bg-gray-50"
                >
                  Previous
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={href({ status, page: page + 1 })}
                  className="rounded-lg border px-3 py-1.5 hover:bg-gray-50"
                >
                  Next
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}