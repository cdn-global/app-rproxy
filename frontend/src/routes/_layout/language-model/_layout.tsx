import { Outlet, createFileRoute } from '@tanstack/react-router'
import { SidebarNav } from '@/components/Common/SidebarNav'
import { Separator } from '@/components/ui/separator'

export const Route = createFileRoute('/_layout/language-model/_layout')({
  component: LanguageModelLayout,
})

const sidebarNavItems = [
  {
    title: 'Language Model',
    href: '/language-model',
  },
  {
    title: 'Billing',
    href: '/language-model/billing',
  },
  {
    title: 'LLM Service',
    href: '/language-model/llm-service',
  },
]

function LanguageModelLayout() {
  return (
    <>
      <div className="space-y-6 p-10 pb-16 md:block">
        <div className="space-y-0.5">
          <h2 className="text-2xl font-bold tracking-tight">Language Model</h2>
          <p className="text-muted-foreground">
            Manage your language model settings.
          </p>
        </div>
        <Separator className="my-6" />
        <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
          <aside className="-mx-4 lg:w-1/5">
            <SidebarNav items={sidebarNavItems} />
          </aside>
          <div className="flex-1 lg:max-w-full">
            <Outlet />
          </div>
        </div>
      </div>
    </>
  )
}
