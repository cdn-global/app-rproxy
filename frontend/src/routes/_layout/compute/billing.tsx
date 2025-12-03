import { createFileRoute } from '@tanstack/react-router'
import BillingTab from "@/components/Common/BillingTab";

export const Route = createFileRoute('/_layout/compute/billing')({
  component: Component,
})

function Component() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-4">Compute Billing</h1>
      <BillingTab />
    </div>
  );
}