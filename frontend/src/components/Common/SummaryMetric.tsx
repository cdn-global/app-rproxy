const SummaryMetric = ({
  label,
  value,
  description,
}: {
  label: string
  value: string
  description: string
}) => (
  <div className="rounded-3xl border border-slate-200/70 bg-white/70 p-5 shadow-[0_18px_40px_-35px_rgba(15,23,42,0.45)] dark:border-slate-700/60 dark:bg-slate-900/60">
    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-500">
      {label}
    </p>
    <p className="mt-3 text-2xl font-semibold text-slate-900 dark:text-slate-100">
      {value}
    </p>
    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{description}</p>
  </div>
)

export default SummaryMetric
