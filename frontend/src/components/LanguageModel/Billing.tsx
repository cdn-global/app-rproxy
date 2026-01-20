import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function Billing() {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-full rounded-[28px] border border-slate-200/70 bg-white/95 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.5)] backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-[0_24px_60px_-35px_rgba(15,23,42,0.65)]">
          <div className="space-y-2 border-b border-slate-200/70 p-6 dark:border-slate-700/60">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Billing</h3>
          </div>
          <div className="p-6 pl-2">
            This is the billing page.
          </div>
        </div>
      </div>
    </>
  )
}

export default Billing
