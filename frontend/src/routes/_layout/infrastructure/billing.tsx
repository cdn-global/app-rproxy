import { createFileRoute } from '@tanstack/react-router'
import BillingTab from "@/components/Common/BillingTab";

export const Route = createFileRoute('/_layout/infrastructure/billing')({
  component: Component,
})

function Component() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-4">Infrastructure Billing</h1>
      <BillingTab />
    </div>
  );
}