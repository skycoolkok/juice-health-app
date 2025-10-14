export type NutrientProgressEntry = {
  key: string;
  label: string;
  unit: string;
  value: number | null;
  percent: number | null;
  targetLabel?: string;
  targetValue?: number | null;
};

export type NutrientProgressListProps = {
  entries: NutrientProgressEntry[];
  className?: string;
  percentSuffix?: string;
  naLabel?: string;
  missingLabel?: string;
  defaultTargetLabel?: string;
};

export function formatNutrientValue(value: number | null, fractionDigits = 2): string {
  if (value === null || Number.isNaN(value)) {
    return "NA";
  }
  const fixed = Number(value).toFixed(fractionDigits);
  return fractionDigits > 0 ? fixed.replace(/\.0+$/, (match) => (match === ".0" ? "" : match)) : fixed;
}

export function getPercentBarClass(percent: number | null): string {
  if (percent === null) return "bg-slate-300";
  if (percent > 120) return "bg-red-500";
  if (percent > 100) return "bg-orange-500";
  return "bg-emerald-500";
}

export function clampPercentWidth(percent: number | null): number {
  if (percent === null || Number.isNaN(percent)) return 0;
  return Math.min(percent, 160);
}

export function NutrientProgressList({
  entries,
  className,
  percentSuffix = "%",
  naLabel = "NA",
  missingLabel = "Data missing (NA)",
  defaultTargetLabel = "",
}: NutrientProgressListProps) {
  const containerClass = className ?? "space-y-4";

  const isMissingValue = (value: number | null | undefined): boolean =>
    value === null || value === undefined || Number.isNaN(value);

  return (
    <div className={containerClass}>
      {entries.map((entry) => {
        const barClass = getPercentBarClass(entry.percent);
        const barWidth = clampPercentWidth(entry.percent);
        const targetExists = entry.targetValue !== undefined;
        const resolvedTargetLabel = (entry.targetLabel ?? defaultTargetLabel).trim();
        const valueLabel = [
          isMissingValue(entry.value) ? naLabel : formatNutrientValue(entry.value, 2),
          entry.unit,
        ]
          .filter(Boolean)
          .join(" ");

        const targetValueText = targetExists
          ? isMissingValue(entry.targetValue) ? naLabel : formatNutrientValue(entry.targetValue ?? null, 2)
          : "";
        const targetDisplay = targetExists
          ? [resolvedTargetLabel, targetValueText, entry.unit].filter((part) => part && part.length > 0).join(" ")
          : resolvedTargetLabel;

        return (
          <div key={entry.key} className="space-y-2 rounded-xl border border-slate-100 bg-white/90 p-4 shadow-sm">
            <div className="flex items-center justify-between text-sm font-medium text-slate-600">
              <span>{entry.label}</span>
              <span>{valueLabel}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>{targetDisplay}</span>
              <span title={entry.percent === null ? missingLabel : undefined}>
                {entry.percent === null
                  ? naLabel
                  : `${formatNutrientValue(entry.percent, 1)}${percentSuffix}`}
              </span>
            </div>
            <div
              className="h-2 w-full rounded-full bg-slate-200"
              title={entry.percent === null ? missingLabel : undefined}
            >
              <div
                className={["h-2 rounded-full transition-all", barClass].filter(Boolean).join(" ")}
                style={{ width: entry.percent === null ? "100%" : `${barWidth}%`, opacity: entry.percent === null ? 0.5 : 1 }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}


