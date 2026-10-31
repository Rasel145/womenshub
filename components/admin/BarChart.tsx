export type ChartSeries = {
  name: string;
  values: number[];
  color: "pink" | "gray";
};

const BAR_CLASS = { pink: "fill-pink-600", gray: "fill-gray-300" };
const DOT_CLASS = { pink: "bg-pink-600", gray: "bg-gray-300" };

const compact = new Intl.NumberFormat("en", {
  notation: "compact",
  maximumFractionDigits: 1,
});

// 1234 -> 2000, 37 -> 50, so the top line of the chart is a round number
function niceMax(max: number) {
  if (max <= 0) return 1;
  const pow = 10 ** Math.floor(Math.log10(max));
  const n = max / pow;
  const nice = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return nice * pow;
}

export default function BarChart({
  title,
  labels,
  series,
  format = (n: number) => n.toLocaleString("en-US"),
  labelEvery = 1,
}: {
  title: string;
  labels: string[];
  series: ChartSeries[];
  format?: (n: number) => string;
  labelEvery?: number;
}) {
  const W = 720;
  const H = 280;
  const L = 52;
  const R = 8;
  const T = 12;
  const B = 30;
  const plotW = W - L - R;
  const plotH = H - T - B;

  const rawMax = Math.max(0, ...series.flatMap((s) => s.values));
  const max = niceMax(rawMax);
  const ticks = [0, 1, 2, 3, 4].map((i) => (max * i) / 4);

  const groupW = plotW / labels.length;
  const barW = Math.min(30, (groupW * 0.72) / series.length);
  const barsW = barW * series.length;

  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold">{title}</h2>
        <ul className="flex flex-wrap gap-4 text-xs text-gray-500">
          {series.map((s) => (
            <li key={s.name} className="flex items-center gap-1.5">
              <span className={`inline-block h-2.5 w-2.5 rounded-sm ${DOT_CLASS[s.color]}`} />
              {s.name}
            </li>
          ))}
        </ul>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={title}>
        {/* Horizontal lines and the numbers on the left */}
        {ticks.map((t) => {
          const y = T + plotH - (t / max) * plotH;
          return (
            <g key={t}>
              <line
                x1={L}
                x2={W - R}
                y1={y}
                y2={y}
                className="stroke-gray-200"
                strokeWidth={1}
              />
              <text
                x={L - 6}
                y={y + 4}
                textAnchor="end"
                fontSize={11}
                className="fill-gray-500"
              >
                {compact.format(t)}
              </text>
            </g>
          );
        })}

        {/* Bars. Hover on a bar to see the exact number. */}
        {labels.map((label, i) => {
          const groupX = L + i * groupW + (groupW - barsW) / 2;

          return (
            <g key={label + i}>
              {series.map((s, j) => {
                const value = s.values[i] ?? 0;
                const h = (value / max) * plotH;

                return (
                  <rect
                    key={s.name}
                    x={groupX + j * barW}
                    y={T + plotH - h}
                    width={Math.max(barW - 2, 1)}
                    height={h}
                    rx={2}
                    className={BAR_CLASS[s.color]}
                  >
                    <title>{`${label} - ${s.name}: ${format(value)}`}</title>
                  </rect>
                );
              })}

              {i % labelEvery === 0 && (
                <text
                  x={L + i * groupW + groupW / 2}
                  y={H - 10}
                  textAnchor="middle"
                  fontSize={11}
                  className="fill-gray-500"
                >
                  {label}
                </text>
              )}
            </g>
          );
        })}

        {rawMax === 0 && (
          <text
            x={W / 2}
            y={T + plotH / 2}
            textAnchor="middle"
            fontSize={13}
            className="fill-gray-400"
          >
            No orders in this period
          </text>
        )}
      </svg>
    </div>
  );
}