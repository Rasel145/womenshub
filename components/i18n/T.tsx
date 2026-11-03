import { bn } from "@/lib/i18n/bn";

// Usage: <T>Add to Cart</T>
// With a changing part: <T vars={{ amount: "৳500" }}>{"Add {amount} more"}</T>
// Works in server and client components. Only one of the two texts is visible (see globals.css).
export default function T({
  children,
  vars,
}: {
  children: string;
  vars?: Record<string, string | number>;
}) {
  const fill = (text: string) =>
    vars
      ? text.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? `{${key}}`))
      : text;

  const english = fill(children);
  const bangla = bn[children];

  if (!bangla) return <>{english}</>;

  return (
    <span className="t-pair">
      <span data-l="en">{english}</span>
      <span data-l="bn">{fill(bangla)}</span>
    </span>
  );
}