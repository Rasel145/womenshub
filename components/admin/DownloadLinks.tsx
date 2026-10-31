import { FileSpreadsheet, FileText } from "lucide-react";

export default function DownloadLinks({
  year,
  month,
}: {
  year: number;
  month?: number;
}) {
  const base = `/api/admin/reports/export?year=${year}${month ? `&month=${month}` : ""}`;
  const button =
    "inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-gray-50";

  return (
    <div className="flex flex-wrap gap-2">
      <a href={`${base}&format=xlsx`} className={button}>
        <FileSpreadsheet size={16} className="text-green-600" />
        Download Excel
      </a>
      <a href={`${base}&format=pdf`} className={button}>
        <FileText size={16} className="text-red-600" />
        Download PDF
      </a>
    </div>
  );
}