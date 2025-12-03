import { createFileRoute } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Responsive, WidthProvider } from "react-grid-layout"

const ResponsiveGridLayout = WidthProvider(Responsive)

const mockDatabaseResources = [
  {
    id: "db-master",
    name: "Primary Database Server",
    type: "PostgreSQL 14",
    vcpu: 8,
    ram: "32GB",
    storage: "1TB SSD",
    price: 350,
  },
  {
    id: "db-replica",
    name: "Read Replica",
    type: "PostgreSQL 14",
    vcpu: 4,
    ram: "16GB",
    storage: "1TB SSD",
    price: 150,
  },
  {
    id: "db-backup",
    name: "Backup Storage",
    type: "Blob Storage",
    storage: "5TB",
    price: 50,
  },
]

function InstanceDetailsPage() {
  const totalCost = mockDatabaseResources.reduce(
    (acc, resource) => acc + resource.price,
    0,
  )

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Managed Database Instance</CardTitle>
          <CardDescription>
            Details for your managed PostgreSQL instance.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <h2 className="text-xl font-bold">
              Monthly Cost: ${totalCost.toFixed(2)}
            </h2>
          </div>
          <ResponsiveGridLayout
            className="layout"
            layouts={layouts}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={{ lg: 2, md: 2, sm: 1, xs: 1, xxs: 1 }}
          >
            <div key="b">
              <Card>
                <CardHeader>
                  <CardTitle>Cost Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Graph of cost breakdown here</p>
                </CardContent>
              </Card>
            </div>
            <div key="c">
              <Card>
                <CardHeader>
                  <CardTitle>Resource Utilization</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Graph of resource utilization here</p>
                </CardContent>
              </Card>
            </div>
          </ResponsiveGridLayout>

          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Resource
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  vCPU
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  RAM
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Storage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Price
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {mockDatabaseResources.map((resource) => (
                <tr key={resource.id}>
                  <td className="whitespace-nowrap px-6 py-4">
                    {resource.name}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    {resource.type}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    {resource.vcpu ?? "N/A"}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    {resource.ram ?? "N/A"}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    {resource.storage}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    ${resource.price.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 flex justify-end">
            <Button>Upgrade Instance</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
const layouts = {
  lg: [
    { i: "b", x: 0, y: 0, w: 1, h: 2 },
    { i: "c", x: 1, y: 0, w: 1, h: 2 },
  ],
}

export const Route = createFileRoute("/_layout/managed-database/instance")({
  component: InstanceDetailsPage,
})
