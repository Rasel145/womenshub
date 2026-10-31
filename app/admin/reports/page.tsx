import { Suspense } from "react";
import Link from "next/link";
import clsx from "clsx";
import { requireAdmin } from "@/lib/auth";
import { formatPrice } from "@/lib/utils";
import BarChart from "@/components/admin/BarChart";
import DownloadLinks from "@/components/admin/DownloadLinks";
import {
  MONTH_NAMES,
  dhakaNow,
  getAvailableYears,
  getYearSummary,
  totalsOf,
} from "@/lib/reports";

const compactTaka = new Intl.NumberFormat("en", {
  notation: "compact",
  maximumFractionDigits: 1,
});

type SearchParams = Promise<{ year?: string }>;

export default function ReportsPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense fallback={<p className="text-gray-500">Loading...</p>}>
      <ReportsContent searchParams={searchParams} />
    </Suspense>
  );
}

// "+12%" in green, "-5%" in red
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

async function ReportsContent({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin();

  const sp = await searchParams;
  const years = await getAvailableYears();
  const requested = Number(sp.year);
  const year = years.includes(requested) ? requested : years[0];

  const [rows, prevRows] = await Promise.all([
    getYearSummary(year),
    getYearSummary(year - 1),
  ]);

  const totals = totalsOf(rows);
  const prevTotals = totalsOf(prevRows);
  const hasPrev = prevTotals.orders > 0;
  const now = dhakaNow();

  const labels = MONTH_NAMES.map((m) => m.slice(0, 3));

  const salesSeries = [
    { name: String(year), values: rows.map((r) => r.sales), color: "pink" as const },
    ...(hasPrev
      ? [{ name: String(year - 1), values: prevRows.map((r) => r.sales), color: "gray" as const }]
      : []),
  ];
  const orderSeries = [
    { name: String(year), values: rows.map((r) => r.orders), color: "pink" as const },
    ...(hasPrev
      ? [{ name: String(year - 1), values: prevRows.map((r) => r.orders), color: "gray" as const }]
      : []),
  ];

  const cards = [
    {
      label: "Orders placed",
      value: totals.orders.toLocaleString("en-US"),
      change: <Change current={totals.orders} previous={prevTotals.orders} />,
    },
    {
      label: "Sales",
      value: formatPrice(totals.sales),
      change: <Change current={totals.sales} previous={prevTotals.sales} />,
    },
    { label: "Delivered revenue", value: formatPrice(totals.deliveredRevenue) },
    { label: "Average order", value: formatPrice(totals.averageOrder) },
    {
      label: "Cancelled orders",
      value: totals.cancelled.toLocaleString("en-US"),
      note: totals.orders
        ? `${Math.round((totals.cancelled / totals.orders) * 100)}% of orders`
        : undefined,
    },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Reports</h1>
        <DownloadLinks year={year} />
      </div>

      {/* Year */}
      <div className="mb-6 flex flex-wrap gap-2">
        {years.map((y) => (
          <Link
            key={y}
            href={`/admin/reports?year=${y}`}
            className={clsx(
              "rounded-full px-4 py-1.5 text-sm",
              y === year ? "bg-pink-600 text-white" : "bg-gray-100 hover:bg-gray-200"
            )}
          >
            {y}
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border bg-white p-4">
            <p className="text-xs text-gray-500">{c.label}</p>
            <p className="mt-1 text-xl font-bold">{c.value}</p>
            {"change" in c && c.change && hasPrev && (
              <p className="mt-1 text-xs text-gray-500">{c.change} vs {year - 1}</p>
            )}
            {"note" in c && c.note && (
              <p className="mt-1 text-xs text-gray-500">{c.note}</p>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 space-y-6">
        <BarChart
          title="Sales by month (BDT)"
          labels={labels}
          series={salesSeries}
          format={(n) => `৳${n.toLocaleString("en-US")}`}
        />
        <BarChart
          title="Orders by month"
          labels={labels}
          series={orderSeries}
        />
      </div>

      {/* Month by month */}
      <div className="mt-6 overflow-x-auto rounded-xl border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-gray-50 text-xs text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">Month</th>
              <th className="px-4 py-3 text-right font-medium">Orders</th>
              <th className="px-4 py-3 text-right font-medium">Cancelled</th>
              <th className="px-4 py-3 text-right font-medium">Delivered</th>
              <th className="px-4 py-3 text-right font-medium">Sales</th>
              <th className="px-4 py-3 text-right font-medium">vs last month</th>
              <th className="px-4 py-3 text-right font-medium">vs {year - 1}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const future = year === now.year && r.month > now.month;
              const previousMonth = i > 0 ? rows[i - 1] : prevRows[11];

              return (
                <tr
                  key={r.month}
                  className={clsx(
                    "border-b last:border-0",
                    future ? "text-gray-400" : "hover:bg-gray-50"
                  )}
                >
                  <td className="px-4 py-3 font-medium">
                    <Link
                      href={`/admin/reports/${year}/${r.month}`}
                      className="text-pink-600 hover:underline"
                    >
                      {MONTH_NAMES[i]}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-right">{r.orders}</td>
                  <td className="px-4 py-3 text-right">{r.cancelled}</td>
                  <td className="px-4 py-3 text-right">{r.delivered}</td>
                  <td className="px-4 py-3 text-right font-semibold">
                    {formatPrice(r.sales)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {future ? "-" : <Change current={r.sales} previous={previousMonth.sales} />}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {future ? "-" : <Change current={r.sales} previous={prevRows[i].sales} />}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t bg-gray-50 font-semibold">
              <td className="px-4 py-3">{year} total</td>
              <td className="px-4 py-3 text-right">{totals.orders}</td>
              <td className="px-4 py-3 text-right">{totals.cancelled}</td>
              <td className="px-4 py-3 text-right">{totals.delivered}</td>
              <td className="px-4 py-3 text-right">{formatPrice(totals.sales)}</td>
              <td className="px-4 py-3" />
              <td className="px-4 py-3 text-right">
                <Change current={totals.sales} previous={prevTotals.sales} />
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <p className="mt-3 text-xs text-gray-400">
        Orders = all orders placed, including cancelled. Sales = total of orders that were
        not cancelled (pending and shipped orders included). Delivered revenue = delivered
        orders only. Months use Bangladesh time. Top of the chart: {compactTaka.format(
          Math.max(0, ...rows.map((r) => r.sales))
        )}.
      </p>
    </div>
  );
}