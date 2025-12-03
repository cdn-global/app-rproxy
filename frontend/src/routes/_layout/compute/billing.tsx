import { computeServers } from "@/data/compute";
import { columns } from "@/components/Dashboard/data-table/columns-billing";
import { DataTable } from "@/components/Dashboard/data-table/data-table";

export function Component() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-4">Compute Billing</h1>
      <DataTable columns={columns} data={computeServers} />
    </div>
  );
}