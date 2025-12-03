import { createFileRoute } from "@tanstack/react-router"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import PageScaffold from "@/components/Common/PageLayout"

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
    <PageScaffold sidebar={null}>
      <div className="mx-auto w-full max-w-4xl space-y-4">
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
            <Card>
              <CardHeader>
                <CardTitle>Cost Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Graph of cost breakdown here</p>
              </CardContent>
            </Card>
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Resource Utilization</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Graph of resource utilization here</p>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Resource Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Resource</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>vCPU</TableHead>
                  <TableHead>RAM</TableHead>
                  <TableHead>Storage</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockDatabaseResources.map((resource) => (
                  <TableRow key={resource.id}>
                    <TableCell>{resource.name}</TableCell>
                    <TableCell>{resource.type}</TableCell>
                    <TableCell>{resource.vcpu ?? "N/A"}</TableCell>
                    <TableCell>{resource.ram ?? "N/A"}</TableCell>
                    <TableCell>{resource.storage}</TableCell>
                    <TableCell className="text-right">
                      ${resource.price.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </PageScaffold>
  )
}

export const Route = createFileRoute("/_layout/managed-database/instance")({
  component: InstanceDetailsPage,
})
