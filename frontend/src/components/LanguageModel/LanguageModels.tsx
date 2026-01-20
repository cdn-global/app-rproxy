import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { DollarSign } from 'lucide-react'
import { FC } from 'react'

interface LanguageModelsProps {}

const LanguageModels: FC<LanguageModelsProps> = ({}) => {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      <div className="rounded-[28px] border border-slate-200/70 bg-white/95 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.5)] backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-[0_24px_60px_-35px_rgba(15,23,42,0.65)]">
        <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
          <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100">LLM Service</h3>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="p-6 pt-0">
          <div className="text-2xl font-bold">$45,231.89</div>
          <p className="text-xs text-muted-foreground">
            +20.1% from last month
          </p>
        </div>
        <p className="p-4 text-sm text-slate-600 dark:text-slate-400">
          This is the LLM Service.
        </p>
      </div>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Billing</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">$45,231.89</div>
          <p className="text-xs text-muted-foreground">
            +20.1% from last month
          </p>
        </CardContent>
        <CardDescription className="p-4">
          This is the Billing.
        </CardDescription>
      </Card>
    </div>
  )
}

export default LanguageModels
