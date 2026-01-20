import { createFileRoute } from '@tanstack/react-router'
import BillingTab from "@/components/Common/BillingTab";
import PageScaffold from "@/components/Common/PageLayout";

export const Route = createFileRoute('/_layout/infrastructure/billing')({
  component: Component,
})

function Component() {
  return (
    <PageScaffold sidebar={null}>
      <h1 className="text-2xl font-bold mb-4">Infrastructure Billing</h1>
      <BillingTab />
    </PageScaffold>
  );
}