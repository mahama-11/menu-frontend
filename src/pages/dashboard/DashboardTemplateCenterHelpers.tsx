export function MetricCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/40">{label}</p>
      <p className="mt-2 text-3xl font-black text-white">{value}</p>
      <p className="mt-2 text-sm text-white/45">{hint}</p>
    </div>
  );
}

export function DetailStat({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/40">{title}</p>
      <p className="mt-2 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

export function SelectFilter({
  label,
  value,
  options,
  allLabel,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ id: string; label: string }>;
  allLabel: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-white/8 bg-black/20 px-3 py-3">
      <label className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">{label}</label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full bg-transparent text-sm text-white outline-none"
      >
        <option value="" className="bg-[#111118]">
          {allLabel}
        </option>
        {options.map((option) => (
          <option key={option.id} value={option.id} className="bg-[#111118]">
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function buildLabelMap(items: Array<{ id: string; label: string }>) {
  return items.reduce<Record<string, string>>((acc, item) => {
    acc[item.id] = item.label;
    return acc;
  }, {});
}

export function labelFor(id: string, labels: Record<string, string>) {
  return labels[id] || id;
}

export function platformSummary(platforms: string[], labels: Record<string, string>) {
  if (platforms.length === 0) return 'Template';
  if (platforms.length === 1) return labelFor(platforms[0], labels);
  return `${labelFor(platforms[0], labels)} +${platforms.length - 1}`;
}
