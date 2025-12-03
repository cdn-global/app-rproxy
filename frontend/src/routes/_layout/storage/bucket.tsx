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

const mockStorageResources = [
  {
    id: "storage-main",
    name: "Main Storage Bucket",
    type: "S3 Standard",
    storage: "2TB",
    price: 50,
  },
  {
    id: "storage-backup",
    name: "Backup Storage Bucket",
    type: "Glacier Deep Archive",
    storage: "10TB",
    price: 10,
  },
  {
    id: "data-transfer",
    name: "Data Transfer",
    type: "Outbound",
    usage: "5TB/month",
    price: 450,
  },
]

function BucketDetailsPage() {
  const totalCost = mockStorageResources.reduce(
    (acc, resource) => acc + resource.price,
    0,
  )

  return (
    <PageScaffold sidebar={null}>
      <div className="mx-auto w-full max-w-4xl space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Storage Bucket Details</CardTitle>
            <CardDescription>
              Details for your S3 compatible storage bucket.
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
                <CardTitle>Usage Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Graph of usage metrics here</p>
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
                  <TableHead>Usage</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockStorageResources.map((resource) => (
                  <TableRow key={resource.id}>
                    <TableCell>{resource.name}</TableCell>
                    <TableCell>{resource.type}</TableCell>
                    <TableCell>
                      {resource.usage ?? resource.storage}
                    </TableCell>
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

export const Route = createFileRoute("/_layout/storage/bucket")({
  component: BucketDetailsPage,
})
